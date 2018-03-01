import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  delay,
  promisify
} from 'bluebird';

let _pollQueryCompletedState = async function({
  QueryExecutionId,
  getQueryExecutionAsync,
  pollingDelay
}) {
  let data = await getQueryExecutionAsync({QueryExecutionId});
  let state = data.QueryExecution.Status.State;
  if (state === 'RUNNING' || state === 'QUEUED') {
    await delay(pollingDelay);

    // eslint-disable-next-line fp/no-arguments
    return await _pollQueryCompletedState(arguments);
  }

  return state;
};

let _queryResultToObject = function(queryResult) {
  let columnsNames = [];
  _.forEach(queryResult.ResultSet.Rows[0].Data, function(value, index) {
    columnsNames[index] = value.VarCharValue;
  });

  let rows = _.drop(queryResult.ResultSet.Rows, 1);
  let rowsObjects = _.map(rows, function(row) {
    let rowObject = {};

    _.forEach(columnsNames, function(columnName, columnIndex) {
      rowObject[columnName] = row.Data[columnIndex].VarCharValue;
    });

    return rowObject;
  });

  return rowsObjects;
};

export let executeQuery = async function({
  athena = new aws.Athena({apiVersion: '2017-05-18'}),
  params = {
    QueryString: '',
    ResultConfiguration: {
      OutputLocation: 's3://aws-athena-query-results-094611745175-eu-west-1/'
    }
  },
  pollingDelay = 1000,
  initPollingDelay = pollingDelay
}) {
  let startQueryExecutionAsync = promisify(athena.startQueryExecution, {context: athena});
  let getQueryExecutionAsync = promisify(athena.getQueryExecution, {context: athena});
  let getQueryResultsAsync = promisify(athena.getQueryResults, {context: athena});

  let queryExecutionData = await startQueryExecutionAsync(params);
  let {QueryExecutionId} = queryExecutionData;

  await delay(initPollingDelay);
  let status = await _pollQueryCompletedState({
    QueryExecutionId,
    getQueryExecutionAsync,
    pollingDelay
  });

  if (status !== 'SUCCEEDED') {
    throw Error("Athena: query didn't succeed.");
  }

  let queryResult = await getQueryResultsAsync({QueryExecutionId});
  let resultObject = _queryResultToObject(queryResult);
  return resultObject;
};

export default exports;
