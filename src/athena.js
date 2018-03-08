import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  delay
} from 'bluebird';

export let pollQueryCompletedState = async function({
  athena,
  QueryExecutionId,
  pollingDelay = 1000
}) {
  let data = await athena.getQueryExecution({QueryExecutionId}).promise();
  let state = data.QueryExecution.Status.State;
  if (state === 'RUNNING' || state === 'QUEUED' || state === 'SUBMITTED') {
    await delay(pollingDelay);

    // eslint-disable-next-line fp/no-arguments
    return await pollQueryCompletedState(...arguments);
  }

  return state;
};

export let queryResultToObjectsArray = function(queryResult) {
  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;
  let columnsNames = _.map(columnInfo, 'Name');

  let rows = queryResult.ResultSet.Rows;
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
  let queryExecutionData = await athena.startQueryExecution(params).promise();
  let {QueryExecutionId} = queryExecutionData;

  await delay(initPollingDelay);
  let status = await pollQueryCompletedState({
    athena,
    QueryExecutionId,
    pollingDelay
  });

  if (status !== 'SUCCEEDED') {
    throw Error("Athena: query didn't succeed.");
  }

  let queryResult = await athena.getQueryResults({QueryExecutionId}).promise();
  let resultObject = queryResultToObjectsArray(queryResult);
  resultObject = _.drop(resultObject, 1); // first row is column names
  return resultObject;
};

export default exports;
