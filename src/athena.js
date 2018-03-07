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

export let queryResultToObject = function(queryResult) {
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
  let resultObject = queryResultToObject(queryResult);
  return resultObject;
};

export default exports;
