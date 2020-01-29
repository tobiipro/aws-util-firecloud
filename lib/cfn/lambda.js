"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.maybeReuseCode = exports.getLogGroup = exports.getRole = exports.getPolicy = exports.getPolicyStatement = exports.getCodeChecksums = exports.getCodeChecksumVariables = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _lambda = _interopRequireDefault(require("./lambda.get-code-checksum-variables"));
var _lambda2 = _interopRequireDefault(require("./lambda.get-code-checksums"));

var _principal = require("../principal");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}







let getCodeChecksumVariables = _lambda.default;exports.getCodeChecksumVariables = getCodeChecksumVariables;

let getCodeChecksums = _lambda2.default;exports.getCodeChecksums = getCodeChecksums;

let getPolicyStatement = function ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  env } =


{}) {
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

let getPolicy = function ({
  env })


{
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

let getLogGroup = function ({ functionName, _env }) {
  let LogGroup = {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${functionName}`,
      RetentionInDays: 7 } };



  return LogGroup;
};exports.getLogGroup = getLogGroup;

let maybeReuseCode = async function ({
  Lambda,
  env })
{
  let codeChecksumVariables = await (async createError => {try {return await exports.getCodeChecksumVariables({
        Code: Lambda.Properties.Code,
        FunctionName: Lambda.Properties.FunctionName,
        env });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  _lodashFirecloud.default.merge(Lambda, {
    Properties: {
      Code: {
        S3Bucket: codeChecksumVariables.LAMBDA_CODE_S3BUCKET,
        S3Key: codeChecksumVariables.LAMBDA_CODE_S3KEY },

      Environment: {
        Variables: codeChecksumVariables } } });



};exports.maybeReuseCode = maybeReuseCode;

//# sourceMappingURL=lambda.js.map