"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.addFirehoseToS3 = void 0;

var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));

var _principal = require("../principal");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable import/prefer-default-export */



// FIXME this needs some serious refactoring
let addFirehoseToS3 = function ({
  BucketName,
  BufferingHints,
  CompressionFormat,
  DeliveryStreamName,
  Prefix = 'default',
  Resources,
  env,
  resName,
  LogStreamName,
  logGroupResName,
  resNs })
{
  Prefix = _lodashFirecloud.default.replace(Prefix, /\/$/, '');

  if (_lodashFirecloud.default.isUndefined(resName)) {
    resName = _lodashFirecloud.default.upperFirst(_lodashFirecloud.default.camelCase(Prefix === 'default' ? '' : Prefix));
    resName = `${resName}FirehoseToS3`;
  }

  let {
    LogGroupName } =
  Resources[logGroupResName].Properties;
  LogStreamName = _lodashFirecloud.default.defaultTo(LogStreamName, Prefix);

  let logStream = {
    DependsOn: [
    `${resNs}${logGroupResName}`],

    Type: 'AWS::Logs::LogStream',
    Properties: {
      LogGroupName,
      LogStreamName } };



  let policyStatements = [];
  policyStatements.push({
    Sid: 'Allow write access to firehose bucket',
    Effect: 'Allow',
    Action: [
    's3:AbortMultipartUpload',
    's3:GetBucketLocation',
    's3:Get*',
    's3:List*',
    's3:ListBucketMultipartUploads',
    's3:PutBucketAcl',
    's3:PutObject*'],

    Resource: [
    `arn:aws:s3:::${BucketName}`,
    `arn:aws:s3:::${BucketName}/${Prefix}/*`] });


  policyStatements.push({
    Sid: 'Allow write access to error logs',
    Effect: 'Allow',
    Action: [
    'logs:PutLogEvents'],

    Resource: [
    `arn:aws:logs:${env.AWS_REGION}:${env.AWS_ACCOUNT_ID}:log-group:${LogGroupName}:log-stream:${LogStreamName}`] });



  let policy = {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      Description: `${env.ENV_NAME}: ${resName} Policy`,
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: policyStatements } } };




  let role = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: (0, _principal.get)({
            env,
            service: 'firehose' }),

          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': env.AWS_ACCOUNT_ID } } }] },




      ManagedPolicyArns: [{
        Ref: `${resNs}${resName}P` }] } };




  let deliveryStream = {
    DependsOn: [
    `${resNs}${resName}LS`],

    Type: 'AWS::KinesisFirehose::DeliveryStream',
    Properties: {
      DeliveryStreamName,
      S3DestinationConfiguration: {
        BucketARN: `arn:aws:s3:::${BucketName}`,
        BufferingHints,
        CloudWatchLoggingOptions: { // error logging
          Enabled: true,
          LogGroupName,
          LogStreamName },

        CompressionFormat,
        EncryptionConfiguration: undefined,
        Prefix: `${Prefix}/`, // 'YYYY/MM/DD/HH' prefix is implicit
        RoleARN: {
          'Fn::GetAtt': [
          `${resNs}${resName}R`,
          'Arn'] } } } };






  Resources[`${resName}`] = deliveryStream;
  Resources[`${resName}LS`] = logStream;
  Resources[`${resName}P`] = policy;
  Resources[`${resName}R`] = role;
};exports.addFirehoseToS3 = addFirehoseToS3;

//# sourceMappingURL=firehose.js.map