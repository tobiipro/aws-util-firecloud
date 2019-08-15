"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.maybeReuseCode = exports.getLogGroup = exports.getRole = exports.getPolicy = exports.getPolicyStatement = exports.getStorageResources = exports.getCodeChecksums = exports.getCodeChecksumVariables = exports.add = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _lambda = _interopRequireDefault(require("./lambda.add"));
var _lambda2 = _interopRequireDefault(require("./lambda.get-code-checksum-variables"));
var _lambda3 = _interopRequireDefault(require("./lambda.get-code-checksums"));
var _lambda4 = _interopRequireDefault(require("./lambda.get-storage-resources"));
var _lambda5 = _interopRequireDefault(require("./lambda.maybe-reuse-code"));

var _principal = require("../principal");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let add = _lambda.default;exports.add = add;

let getCodeChecksumVariables = _lambda2.default;exports.getCodeChecksumVariables = getCodeChecksumVariables;

let getCodeChecksums = _lambda3.default;exports.getCodeChecksums = getCodeChecksums;

let getStorageResources = _lambda4.default;exports.getStorageResources = getStorageResources;

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

let getLogGroup = function ({ functionName, _env }) {
  let LogGroup = {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${functionName}`,
      RetentionInDays: 7 } };



  return LogGroup;
};exports.getLogGroup = getLogGroup;

let maybeReuseCode = _lambda5.default;exports.maybeReuseCode = maybeReuseCode;

//# sourceMappingURL=lambda.js.map