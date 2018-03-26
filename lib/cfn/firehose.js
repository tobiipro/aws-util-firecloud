'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addFirehoseToS3 = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _principal = require('../principal');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// FIXME this needs some serious refactoring
let addFirehoseToS3 = exports.addFirehoseToS3 = function ({
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
  resNs
}) {
  Prefix = _lodashFirecloud2.default.replace(Prefix, /\/$/, '');
  if (_lodashFirecloud2.default.isUndefined(resName)) {
    resName = _lodashFirecloud2.default.upperFirst(_lodashFirecloud2.default.camelCase(Prefix === 'default' ? '' : Prefix));
    resName = `${resName}FirehoseToS3`;
  }
  let { LogGroupName } = Resources[logGroupResName].Properties;
  LogStreamName = _lodashFirecloud2.default.defaultTo(LogStreamName, Prefix);

  let ToS3LS = {
    DependsOn: [`${resNs}${logGroupResName}`],
    Type: 'AWS::Logs::LogStream',
    Properties: {
      LogGroupName,
      LogStreamName
    }
  };

  let ToS3PStmts = [];

  ToS3PStmts.push({
    Sid: 'Allow write access to firehose bucket',
    Effect: 'Allow',
    Action: ['s3:AbortMultipartUpload', 's3:GetBucketLocation', 's3:Get*', 's3:List*', 's3:ListBucketMultipartUploads', 's3:PutBucketAcl', 's3:PutObject*'],
    Resource: [`arn:aws:s3:::${BucketName}`, `arn:aws:s3:::${BucketName}/${Prefix}/*`]
  });

  ToS3PStmts.push({
    Sid: 'Allow write access to error logs',
    Effect: 'Allow',
    Action: ['logs:PutLogEvents'],
    Resource: [`arn:aws:logs:${env.AWS_REGION}:${env.AWS_ACCOUNT_ID}:log-group:${LogGroupName}:log-stream:${LogStreamName}`]
  });

  let ToS3P = {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      Description: `${env.ENV_NAME}: ${resName} Policy`,
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: ToS3PStmts
      }
    }
  };

  let ToS3R = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: (0, _principal.get)({
            env,
            service: 'firehose'
          }),
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': env.AWS_ACCOUNT_ID
            }
          }
        }]
      },
      ManagedPolicyArns: [{ Ref: `${resNs}${resName}P` }]
    }
  };

  let ToS3 = {
    DependsOn: [`${resNs}${resName}LS`],
    Type: 'AWS::KinesisFirehose::DeliveryStream',
    Properties: {
      DeliveryStreamName,
      S3DestinationConfiguration: {
        BucketARN: `arn:aws:s3:::${BucketName}`,
        BufferingHints,
        CloudWatchLoggingOptions: { // error logging
          Enabled: true,
          LogGroupName,
          LogStreamName
        },
        CompressionFormat,
        EncryptionConfiguration: undefined,
        Prefix: `${Prefix}/`, // 'YYYY/MM/DD/HH' prefix is implicit
        RoleARN: { 'Fn::GetAtt': [`${resNs}${resName}R`, 'Arn'] }
      }
    }
  };

  Resources[`${resName}`] = ToS3;
  Resources[`${resName}LS`] = ToS3LS;
  Resources[`${resName}P`] = ToS3P;
  Resources[`${resName}R`] = ToS3R;
};

exports.default = exports;

//# sourceMappingURL=firehose.js.map