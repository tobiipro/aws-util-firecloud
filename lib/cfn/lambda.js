"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getRole = exports.getPolicy = exports.getPolicyStatement = exports.getStorageResources = exports.add = exports.getCodeChecksumVariables = exports.getCodeChecksums = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _path = _interopRequireDefault(require("path"));

var _config = require("../config");



var _principal = require("../principal");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let getCodeChecksums = async function ({
  Code,
  algorithm = 'sha256',
  env })
{
  let s3 = new _awsSdk.default.S3((0, _config.get)({ env }));

  let Bucket = Code.S3Bucket;
  let Key = `${Code.S3Key}.${algorithm}sum`;

  let getObjectResp;
  try {
    getObjectResp = await (async createError => {try {return await s3.getObject({
          Bucket,
          Key }).
        promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      Bucket,
      Key });

    return [];
  }

  let {
    Body } =
  getObjectResp;
  Body = Body.toString();

  let checksums = {};
  _lodashFirecloud.default.forEach(_lodashFirecloud.default.split(_lodashFirecloud.default.trim(Body), '\n'), function (line) {
    let [
    checksum,
    filename] =
    _lodashFirecloud.default.split(line, '  ');
    checksums[filename] = checksum;
  });

  let filename = _lodashFirecloud.default.last(_lodashFirecloud.default.split(Code.S3Key, '/'));

  return [
  checksums[`${filename}.info`],
  checksums[`core.${filename}.info`]];

};exports.getCodeChecksums = getCodeChecksums;

let getCodeChecksumVariables = async function ({
  Code,
  FunctionName,
  env,
  force = false })
{
  let LAMBDA_CODE_S3BUCKET = Code.S3Bucket;
  let LAMBDA_CODE_S3KEY = Code.S3Key;

  let [
  LAMBDA_CODE_SHA256SUM,
  LAMBDA_CODE_SHA256SUM_CORE] = await (async createError => {try {return (
        await exports.getCodeChecksums({
          env,
          Code }));} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());


  let codeChecksumVariables = {
    LAMBDA_CODE_SHA256SUM,
    LAMBDA_CODE_SHA256SUM_CORE,
    LAMBDA_CODE_S3BUCKET,
    LAMBDA_CODE_S3KEY };


  if (!LAMBDA_CODE_SHA256SUM_CORE) {
    return codeChecksumVariables;
  }

  if (force) {
    return codeChecksumVariables;
  }

  let prevEnvironment;

  // check if lambda code is the same as the current version
  try {
    let lambda = new _awsSdk.default.Lambda((0, _config.get)({ env }));
    ({
      Environment: prevEnvironment } = await (async createError => {try {return (
          await lambda.getFunctionConfiguration({
            FunctionName }).
          promise());} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error()));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      FunctionName });

    return codeChecksumVariables;
  }

  if (!prevEnvironment.Variables.LAMBDA_CODE_S3BUCKET ||
  !prevEnvironment.Variables.LAMBDA_CODE_S3KEY) {
    return codeChecksumVariables;
  }

  let prevCode = {
    S3Bucket: prevEnvironment.Variables.LAMBDA_CODE_S3BUCKET,
    S3Key: prevEnvironment.Variables.LAMBDA_CODE_S3KEY };


  let [
  PREV_LAMBDA_CODE_SHA256SUM,
  PREV_LAMBDA_CODE_SHA256SUM_CORE] = await (async createError => {try {return (
        await exports.getCodeChecksums({
          env,
          Code: prevCode }));} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());


  if (LAMBDA_CODE_SHA256SUM_CORE === PREV_LAMBDA_CODE_SHA256SUM_CORE) {
    // no real code change, so don't change lambda
    Code = prevCode;
    LAMBDA_CODE_SHA256SUM = PREV_LAMBDA_CODE_SHA256SUM;
    ({
      LAMBDA_CODE_S3BUCKET,
      LAMBDA_CODE_S3KEY } =
    prevEnvironment.Variables);

    _lodashFirecloud.default.merge(codeChecksumVariables, {
      LAMBDA_CODE_S3BUCKET,
      LAMBDA_CODE_S3KEY });

  }

  return codeChecksumVariables;
};exports.getCodeChecksumVariables = getCodeChecksumVariables;

let add = async function ({
  Code,
  Resources,
  cfnDir,
  config,
  env,
  resNs,
  force = false })
{
  let FunctionName =
  _lodashFirecloud.default.replace(config.nameTemplate, '{{.Function.Name}}', config.name);

  // eslint-disable-next-line global-require
  let partialTpl = await (async createError => {try {return await require(_path.default.join(cfnDir, 'index.js')).default({
        env,
        dir: cfnDir,
        resNs });} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());


  let Lambda = _lodashFirecloud.default.get(partialTpl, 'Resources.Lambda');
  if (Lambda) {
    delete partialTpl.Resources.Lambda;
  } else {
    Lambda = {};
  }

  _lodashFirecloud.default.merge(Lambda, {
    Properties: {
      Environment: {
        Variables: config.environment || {} } } });




  // filter out storage resources
  partialTpl.Resources = _lodashFirecloud.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
    switch (Resource.Type) {
      case 'AWS::DynamoDB::Table':
      case 'AWS::Kinesis::DeliveryStream':
      case 'AWS::Kinesis::Stream':
      case 'AWS::S3::Bucket':
        return false;
      default:
        return true;}

  });

  partialTpl.Resources = _lodashFirecloud.default.mapKeys(partialTpl.Resources, function (_value, key) {
    return `${resNs}${key}`;
  });

  _lodashFirecloud.default.merge(Resources, partialTpl.Resources);

  Resources[`${resNs}LambdaL`] = _lodashFirecloud.default.defaultTo(Resources[`${resNs}LambdaL`], {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${FunctionName}`,
      RetentionInDays: 7 } });



  let Role = {
    'Fn::GetAtt': [
    'LambdaR',
    'Arn'] };



  if (Resources[`${resNs}LambdaR`]) {
    Role = {
      'Fn::GetAtt': [
      `${resNs}LambdaR`,
      'Arn'] };


  }

  let Variables = {
    APEX_FUNCTION_NAME: config.name, // apex specific
    LAMBDA_FUNCTION_NAME: FunctionName // apex specific
  };

  let codeChecksumVariables = await (async createError => {try {return await exports.getCodeChecksumVariables({
        Code,
        FunctionName,
        env,
        force });} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());

  _lodashFirecloud.default.merge(Variables, codeChecksumVariables);

  Lambda = _lodashFirecloud.default.merge({
    DependsOn: _lodashFirecloud.default.concat([
    `${resNs}LambdaL`],
    _lodashFirecloud.default.get(Lambda, 'DependsOn', [])),
    Type: 'AWS::Lambda::Function',
    Properties: {
      Code,
      Description: config.description,
      FunctionName,
      Handler: config.handler,
      MemorySize: config.memory,
      Timeout: config.timeout,
      Role, // config.role,
      Runtime: config.runtime,
      Environment: {
        Variables } } },


  Lambda);

  return Lambda;
};exports.add = add;

let getStorageResources = async function ({
  cfnDir,
  env,
  resNs })
{
  // eslint-disable-next-line global-require
  let partialTpl = await (async createError => {try {return await require(_path.default.join(cfnDir, 'index.js')).default({
        env,
        dir: cfnDir,
        resNs });} catch (_awaitTraceErr7) {let err = createError();_awaitTraceErr7.stack += "\n...\n" + err.stack;throw _awaitTraceErr7;}})(() => new Error());


  // filter storage resources
  partialTpl.Resources = _lodashFirecloud.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
    switch (Resource.Type) {
      case 'AWS::DynamoDB::Table':
      case 'AWS::Kinesis::Stream':
      case 'AWS::Kinesis::DeliveryStream':
      case 'AWS::S3::Bucket':
        break;
      default:
        return false;}

    return true;
  });

  partialTpl.Resources = _lodashFirecloud.default.mapKeys(partialTpl.Resources, function (_value, key) {
    return `${resNs}${key}`;
  });

  return partialTpl.Resources;
};exports.getStorageResources = getStorageResources;

let getPolicyStatement = function ({ _env } = {}) {
  let Statement = [];

  Statement.push({
    Sid: 'Allow write access to logs',
    Effect: 'Allow',
    Action: [
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents'],

    Resource: 'arn:aws:logs:*:*:*' });


  return Statement;
};exports.getPolicyStatement = getPolicyStatement;

let getPolicy = function ({ env }) {
  let Policy = {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      Description: `${env.ENV_NAME}: API Lambda Policy`,
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: exports.getPolicyStatement({ env }) } } };




  return Policy;
};exports.getPolicy = getPolicy;

let getRole = function ({ env }) {
  let Role = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: (0, _principal.get)({
            env,
            service: 'lambda' }),

          Action: 'sts:AssumeRole' }] },


      ManagedPolicyArns: [] } };



  return Role;
};exports.getRole = getRole;

//# sourceMappingURL=lambda.js.map