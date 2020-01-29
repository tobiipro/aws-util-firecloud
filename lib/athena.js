"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.executeQuery = exports.queryResultIsShowResult = exports.queryResultToText = exports.queryResultToObjectsArray = exports.pollQueryCompletedState = exports.getOutputBucketName = exports.getDatabaseName = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _region = require("./region");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}








let getDatabaseName = function ({ env, region })


{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `${env.ENV_NAME}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  name = _lodashFirecloud.default.toLower(name);
  name = _lodashFirecloud.default.replace(name, /[^a-z0-9-]/g, '_');
  name = _lodashFirecloud.default.replace(name, /-+/g, '_');

  return name;
};exports.getDatabaseName = getDatabaseName;

let getOutputBucketName = function ({ env, region })


{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `aws-athena-query-results-${env.AWS_ACCOUNT_ID}-${region}`;

  return name;
};exports.getOutputBucketName = getOutputBucketName;

let pollQueryCompletedState = async function ({
  athena,
  QueryExecutionId,
  pollingDelay = 1000 })




{
  let data = await (async createError => {try {return await athena.getQueryExecution({ QueryExecutionId }).promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
  let state = data.QueryExecution.Status.State;
  if (state === 'RUNNING' || state === 'QUEUED' || state === 'SUBMITTED') {
    await (async createError => {try {return await _lodashFirecloud.default.sleep(pollingDelay);} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());

    return await (async createError => {try {return await pollQueryCompletedState({
          athena,
          QueryExecutionId,
          pollingDelay });} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());

  }

  return state;
};exports.pollQueryCompletedState = pollQueryCompletedState;

let queryResultToObjectsArray = function (queryResult) {
  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;
  let columns = _lodashFirecloud.default.map(columnInfo, function (column) {
    return _lodashFirecloud.default.pick(column, [
    'Name',
    'Type']);

  });

  let rows = queryResult.ResultSet.Rows;
  let rowsObjects = _lodashFirecloud.default.map(rows, function (row) {
    let rowObject = {};

    _lodashFirecloud.default.forEach(columns, function (column, columnIndex) {
      let value = _lodashFirecloud.default.get(row, `Data[${columnIndex}].VarCharValue`);

      if (_lodashFirecloud.default.isDefined(value)) {
        switch (_lodashFirecloud.default.toLower(column.Type)) {
          case 'integer':
          case 'tinyint':
          case 'smallint':
          case 'bigint':
          case 'double':
            value = Number(value);
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          default:
            break;}

      }

      rowObject[column.Name] = value;
    });

    return rowObject;
  });

  return rowsObjects;
};exports.queryResultToObjectsArray = queryResultToObjectsArray;

let queryResultToText = function (queryResult) {
  let rows = queryResult.ResultSet.Rows;
  let lines = _lodashFirecloud.default.map(rows, function (row) {
    return row.Data[0].VarCharValue;
  });
  return _lodashFirecloud.default.join(lines, '\n');
};exports.queryResultToText = queryResultToText;

let queryResultIsShowResult = function (queryResult) {
  let showColumnSets = [
  [
  'createtab_stmt'],

  [
  'tab_name'],

  [
  'database_name'],

  [
  'partition'],

  [
  'field'],

  [
  'prpt_name',
  'prpt_value']];



  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;

  return _lodashFirecloud.default.some(showColumnSets, function (columnSet) {
    return columnInfo.length === columnSet.length &&
    _lodashFirecloud.default.every(columnInfo, function (column) {
      return column.Name === column.Label &&
      column.Type === 'string' &&
      _lodashFirecloud.default.includes(columnSet, column.Name);
    });
  });
};exports.queryResultIsShowResult = queryResultIsShowResult;

let executeQuery = async function ({
  athena = new _awsSdk.default.Athena(),
  params = {
    QueryString: '',
    ResultConfiguration: {
      OutputLocation: 's3://aws-athena-query-results-094611745175-eu-west-1/' } },


  pollingDelay = 1000,
  initPollingDelay = pollingDelay })





{
  let queryExecutionData = await (async createError => {try {return await athena.startQueryExecution(params).promise();} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());
  let {
    QueryExecutionId } =
  queryExecutionData;

  await (async createError => {try {return await _lodashFirecloud.default.sleep(initPollingDelay);} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());
  let status = await (async createError => {try {return await exports.pollQueryCompletedState({
        athena,
        QueryExecutionId,
        pollingDelay });} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());


  if (status !== 'SUCCEEDED') {
    throw Error("Athena: query didn't succeed.");
  }

  let queryResult;
  let nextToken;
  let rows = [];
  do {
    queryResult = await (async createError => {try {return await athena.getQueryResults({ QueryExecutionId, NextToken: nextToken }).promise();} catch (_awaitTraceErr7) {let err = createError();_awaitTraceErr7.stack += "\n...\n" + err.stack;throw _awaitTraceErr7;}})(() => new Error());

    // checking if the query is a result of SHOW query
    // returing just text in this case, not trying to parse columns and rows
    if (exports.queryResultIsShowResult(queryResult)) {
      return exports.queryResultToText(queryResult);
    }

    nextToken = queryResult.NextToken;

    rows = rows.concat(exports.queryResultToObjectsArray(queryResult));
  } while (_lodashFirecloud.default.isDefined(nextToken));

  rows = _lodashFirecloud.default.drop(rows, 1); // first row is column names
  return rows;
};exports.executeQuery = executeQuery;

//# sourceMappingURL=athena.js.map