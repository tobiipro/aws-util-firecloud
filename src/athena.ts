import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  get as getRegion
} from './region';

import {
  Env,
  Region
} from './types';

export let getDatabaseName = function({env, region}: {
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));

  let name = `${env.ENV_NAME}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  name = _.toLower(name);
  name = _.replace(name, /[^a-z0-9-]/g, '_');
  name = _.replace(name, /-+/g, '_');

  return name;
};

export let getOutputBucketName = function({env, region}: {
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));

  let name = `aws-athena-query-results-${env.AWS_ACCOUNT_ID}-${region}`;

  return name;
};

export let pollQueryCompletedState = async function({
  athena,
  QueryExecutionId,
  pollingDelay = 1000
}: {
  athena: aws.Athena;
  QueryExecutionId: aws.Athena.QueryExecutionId;
  pollingDelay: number;
}): Promise<string> {
  let data = await athena.getQueryExecution({QueryExecutionId}).promise();
  let state = data.QueryExecution.Status.State;
  if (state === 'RUNNING' || state === 'QUEUED' || state === 'SUBMITTED') {
    await _.sleep(pollingDelay);

    return await pollQueryCompletedState({
      athena,
      QueryExecutionId,
      pollingDelay
    });
  }

  return state;
};

export let queryResultToObjectsArray = function(queryResult: aws.Athena.GetQueryResultsOutput): object[] {
  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;
  let columns = _.map(columnInfo, function(column) {
    return _.pick(column, [
      'Name',
      'Type'
    ]);
  });

  let rows = queryResult.ResultSet.Rows;
  let rowsObjects = _.map(rows, function(row) {
    let rowObject = {};

    _.forEach(columns, function(column, columnIndex) {
      let value = _.get(row, `Data[${columnIndex}].VarCharValue`);

      if (_.isDefined(value)) {
        switch (_.toLower(column.Type)) {
        case ('integer'):
        case ('tinyint'):
        case ('smallint'):
        case ('bigint'):
        case ('double'):
          value = Number(value);
          break;
        case ('boolean'):
          value = Boolean(value);
          break;
        default:
          break;
        }
      }

      rowObject[column.Name] = value;
    });

    return rowObject;
  });

  return rowsObjects;
};

export let queryResultToText = function(queryResult: aws.Athena.GetQueryResultsOutput): string {
  let rows = queryResult.ResultSet.Rows;
  let lines = _.map(rows, function(row) {
    return row.Data[0].VarCharValue;
  });
  return _.join(lines, '\n');
};

export let queryResultIsShowResult = function(queryResult: aws.Athena.GetQueryResultsOutput): boolean {
  let showColumnSets = [
    [
      'createtab_stmt'
    ],
    [
      'tab_name'
    ],
    [
      'database_name'
    ],
    [
      'partition'
    ],
    [
      'field'
    ],
    [
      'prpt_name',
      'prpt_value'
    ]
  ];

  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;

  return _.some(showColumnSets, function(columnSet) {
    return columnInfo.length === columnSet.length &&
      _.every(columnInfo, function(column) {
        return column.Name === column.Label &&
              column.Type === 'string' &&
              _.includes(columnSet, column.Name);
      });
  });
};

export let executeQuery = async function({
  athena = new aws.Athena(),
  params = {
    QueryString: '',
    ResultConfiguration: {
      OutputLocation: 's3://aws-athena-query-results-094611745175-eu-west-1/'
    }
  },
  pollingDelay = 1000,
  initPollingDelay = pollingDelay
}: {
  athena: aws.Athena;
  params: aws.Athena.StartQueryExecutionInput;
  pollingDelay: number;
  initPollingDelay: number;
}): Promise<object[] | string> {
  let queryExecutionData = await athena.startQueryExecution(params).promise();
  let {
    QueryExecutionId
  } = queryExecutionData;

  await _.sleep(initPollingDelay);
  let status = await pollQueryCompletedState({
    athena,
    QueryExecutionId,
    pollingDelay
  });

  if (status !== 'SUCCEEDED') {
    throw Error("Athena: query didn't succeed.");
  }

  let queryResult: aws.Athena.GetQueryResultsOutput;
  let nextToken: aws.Athena.GetQueryResultsOutput['NextToken'];
  let rows = [];
  do {
    queryResult = await athena.getQueryResults({QueryExecutionId, NextToken: nextToken}).promise();

    // checking if the query is a result of SHOW query
    // returing just text in this case, not trying to parse columns and rows
    if (queryResultIsShowResult(queryResult)) {
      return queryResultToText(queryResult);
    }

    nextToken = queryResult.NextToken;

    rows = rows.concat(queryResultToObjectsArray(queryResult));
  } while (_.isDefined(nextToken));

  rows = _.drop(rows, 1); // first row is column names
  return rows;
};

export default exports;
