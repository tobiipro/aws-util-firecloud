"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.allowAccessToAthenaOutputBucket = exports.allowQueryAccessToAthena = exports.allowFullAccessToKinesisStream = exports.allowFullAccessToDynamoDbTable = exports.compactStatement = exports.addStatementFromArns = void 0;var _account = _interopRequireDefault(require("../account"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _athena = require("../athena");



var _config = require("../config");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}







// workaround for AWS's limit of 10 Managed Policies per Group
// ref http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-limits.html
let addStatementFromArns = async function ({
  Statement,
  arns,
  env })
{
  let iam = new _awsSdk.default.IAM((0, _config.get)({ env }));

  let arnStatement = await (async createError => {try {return await Promise.all(_lodashFirecloud.default.map(arns, async function (PolicyArn) {
        let {
          Policy } = await (async createError => {try {return (
              await iam.getPolicy({
                PolicyArn }).
              promise());} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
        let {
          PolicyVersion } = await (async createError => {try {return (
              await iam.getPolicyVersion({
                PolicyArn,
                VersionId: Policy.DefaultVersionId }).
              promise());} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
        let stmts = JSON.parse(unescape(PolicyVersion.Document)).Statement;
        stmts = _lodashFirecloud.default.map(stmts, function (stmt, index) {
          let indexPrefix = _lodashFirecloud.default.toString(index + 1);
          if (stmts.length === 0) {
            indexPrefix = '';
          }
          stmt = _lodashFirecloud.default.merge({
            Sid: _lodashFirecloud.default.defaultTo(
            stmt.Sid,
            // `${Policy.PolicyName}${PolicyVersion.VersionId}${index}`
            `${indexPrefix}${PolicyVersion.VersionId}${Policy.PolicyName}`) },

          stmt);
          return stmt;
        });
        return stmts;
      }));} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());

  arnStatement = _lodashFirecloud.default.flatten(arnStatement);

  return Statement.concat(arnStatement);
};exports.addStatementFromArns = addStatementFromArns;

let compactStatement = function ({ Statement }) {
  let map = {};
  _lodashFirecloud.default.forEach(Statement, function (stmt) {
    stmt.Resource = _lodashFirecloud.default.isArray(stmt.Resource) ? stmt.Resource : [
    stmt.Resource];

    let key = JSON.stringify([
    stmt.Effect,
    stmt.Principal,
    stmt.Resource,
    stmt.Condition]);

    map[key] = _lodashFirecloud.default.defaultTo(map[key], []);
    map[key].push(stmt);
  });
  let cStatement = _lodashFirecloud.default.map(map, function (stmts) {
    let {
      Effect,
      Principal,
      Resource,
      Condition } =
    stmts[0];
    let Action = _lodashFirecloud.default.sortBy(_lodashFirecloud.default.uniq(_lodashFirecloud.default.flatten(_lodashFirecloud.default.map(stmts, function (stmt)

    {
      return _lodashFirecloud.default.isArray(stmt.Action) ? stmt.Action : [
      stmt.Action];

    }))));
    return {
      Effect,
      Principal,
      Action,
      Resource,
      Condition };

  });
  _lodashFirecloud.default.forEach(cStatement, function (stmt) {
    let wActions = _lodashFirecloud.default.filter(stmt.Action, function (action) {
      return _lodashFirecloud.default.endsWith(action, '*');
    });
    _lodashFirecloud.default.forEach(wActions, function (wAction) {
      let prefix = _lodashFirecloud.default.replace(wAction, /\*$/, '');
      stmt.Action = _lodashFirecloud.default.reject(stmt.Action, function (action) {
        return action !== wAction && _lodashFirecloud.default.startsWith(action, prefix);
      });
    });
  });
  return cStatement;
};exports.compactStatement = compactStatement;

let allowFullAccessToDynamoDbTable = function ({
  TableName,
  env })
{
  return {
    Sid: `Allow full access to ${TableName} database`,
    Effect: 'Allow',
    Action: [
    'dynamodb:*'],

    Resource: [
    `arn:aws:dynamodb:${env.AWS_REGION}:${_account.default.ID}:table/${TableName}`,
    `arn:aws:dynamodb:${env.AWS_REGION}:${_account.default.ID}:table/${TableName}/index/*`] };


};exports.allowFullAccessToDynamoDbTable = allowFullAccessToDynamoDbTable;

let allowFullAccessToKinesisStream = function ({
  StreamName,
  env })
{
  return {
    Sid: `Allow full access to ${StreamName} stream`,
    Effect: 'Allow',
    Action: [
    'kinesis:*'],

    Resource: [
    `arn:aws:kinesis:${env.AWS_REGION}:${_account.default.ID}:stream/${StreamName}`] };


};exports.allowFullAccessToKinesisStream = allowFullAccessToKinesisStream;

let allowQueryAccessToAthena = function ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  env } =


{}) {
  return {
    Sid: 'Allow query access to Athena',
    Effect: 'Allow',
    Action: [
    'athena:GetQueryExecution',
    'athena:GetQueryResults',
    'athena:StartQueryExecution'],

    Resource: [
    '*'] };


};exports.allowQueryAccessToAthena = allowQueryAccessToAthena;

let allowAccessToAthenaOutputBucket = function ({
  region,
  BucketName,
  env })
{
  BucketName =
  _lodashFirecloud.default.defaultTo(BucketName, (0, _athena.getOutputBucketName)({ env, region }));

  return {
    Sid: `Allow access to ${BucketName} (Athena output) bucket`,
    Effect: 'Allow',
    Action: [
    's3:GetObject',
    's3:PutObject',
    's3:GetBucketLocation'],

    Resource: [
    `arn:aws:s3:::${BucketName}`,
    `arn:aws:s3:::${BucketName}/*`] };


};exports.allowAccessToAthenaOutputBucket = allowAccessToAthenaOutputBucket;

//# sourceMappingURL=iam.js.map