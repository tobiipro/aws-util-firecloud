'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRole = exports.getPolicy = exports.getPolicyStatement = exports.getStorageResources = exports.add = exports.getCodeChecksum = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _build = require('./build');

var _build2 = _interopRequireDefault(_build);

var _config = require('../config');

var _principal = require('../principal');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let getCodeChecksum = exports.getCodeChecksum = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    Code,
    algorithm = 'sha256',
    env
  }) {
    let s3 = new _awsSdk2.default.S3((0, _config.get)({ env }));
    let { Body } = yield s3.getObject({
      Bucket: Code.S3Bucket,
      Key: `${Code.S3Key}.${algorithm}sum`
    }).promise();
    Body = Body.toString();

    let checksums = {};
    _lodashFirecloud2.default.forEach(_lodashFirecloud2.default.split(_lodashFirecloud2.default.trim(Body), '\n'), function (line) {
      let [checksum, filename] = _lodashFirecloud2.default.split(line, '  ');
      checksums[filename] = checksum;
    });

    let filename = _lodashFirecloud2.default.last(_lodashFirecloud2.default.split(Code.S3Key, '/'));

    return [checksums[`${filename}.info`], checksums[`core.${filename}.info`]];
  });

  return function getCodeChecksum(_x) {
    return _ref.apply(this, arguments);
  };
})();

let add = exports.add = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* ({
    Code,
    Resources,
    cfnDir,
    config,
    env,
    resNs
  }) {
    let FunctionName = _lodashFirecloud2.default.replace(config.nameTemplate, '{{.Function.Name}}', config.name);

    let Environment = {
      Variables: config.environment
    };

    let partialTpl = yield (0, _build2.default)({
      env,
      dir: cfnDir,
      partial: true,
      resNs
    });

    let Lambda = _lodashFirecloud2.default.get(partialTpl, 'Resources.Lambda');
    if (Lambda) {
      delete partialTpl.Resources.Lambda;
    } else {
      Lambda = {};
    }

    // filter out storage resources
    partialTpl.Resources = _lodashFirecloud2.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
      switch (Resource.Type) {
        case 'AWS::DynamoDB::Table':
        case 'AWS::Kinesis::DeliveryStream':
        case 'AWS::Kinesis::Stream':
        case 'AWS::S3::Bucket':
          return false;
        default:
          return true;
      }
    });

    partialTpl.Resources = _lodashFirecloud2.default.mapKeys(partialTpl.Resources, function (_value, key) {
      return `${resNs}${key}`;
    });

    _lodashFirecloud2.default.merge(Resources, partialTpl.Resources);

    Resources[`${resNs}LambdaL`] = _lodashFirecloud2.default.defaultTo(Resources[`${resNs}LambdaL`], {
      DeletionPolicy: 'Delete',
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: `/aws/lambda/${FunctionName}`,
        RetentionInDays: 7
      }
    });

    let Role = { 'Fn::GetAtt': ['LambdaR', 'Arn'] };

    if (Resources[`${resNs}LambdaR`]) {
      Role = { 'Fn::GetAtt': [`${resNs}LambdaR`, 'Arn'] };
    }

    let LAMBDA_CODE_S3BUCKET = Code.S3Bucket;
    let LAMBDA_CODE_S3KEY = Code.S3Key;

    let [LAMBDA_CODE_SHA256SUM, LAMBDA_CODE_SHA256SUM_CORE] = yield exports.getCodeChecksum({
      env,
      Code
    });

    if (LAMBDA_CODE_SHA256SUM_CORE) {
      // check if lambda code is the same as the current version
      try {
        let lambda = new _awsSdk2.default.Lambda((0, _config.get)({ env }));
        let {
          Environment: prevEnvironment
        } = yield lambda.getFunctionConfiguration({
          FunctionName
        }).promise();

        let prevCode = {
          S3Bucket: prevEnvironment.Variables.LAMBDA_CODE_S3BUCKET,
          S3Key: prevEnvironment.Variables.LAMBDA_CODE_S3KEY
        };

        let PREV_LAMBDA_CODE_SHA256SUM;
        let PREV_LAMBDA_CODE_SHA256SUM_CORE;

        try {
          [PREV_LAMBDA_CODE_SHA256SUM, PREV_LAMBDA_CODE_SHA256SUM_CORE] = yield exports.getCodeChecksum({
            env,
            Code: prevCode
          });
        } catch (err) {
          if (err.code !== 'NoSuckKey') {
            throw err;
          }
        }

        if (LAMBDA_CODE_SHA256SUM_CORE === PREV_LAMBDA_CODE_SHA256SUM_CORE) {
          // no real code change, so don't change lambda
          Code = prevCode;
          LAMBDA_CODE_SHA256SUM = PREV_LAMBDA_CODE_SHA256SUM;
          ({
            LAMBDA_CODE_S3BUCKET,
            LAMBDA_CODE_S3KEY
          } = prevEnvironment.Variables);
        }
      } catch (_err) {
        // console.error(_err);
      }
    }

    _lodashFirecloud2.default.merge(Environment.Variables, {
      APEX_FUNCTION_NAME: config.name, // apex specific
      LAMBDA_FUNCTION_NAME: FunctionName, // apex specific
      LAMBDA_CODE_SHA256SUM,
      LAMBDA_CODE_SHA256SUM_CORE,
      LAMBDA_CODE_S3BUCKET,
      LAMBDA_CODE_S3KEY
    });

    Lambda = _lodashFirecloud2.default.merge({
      DependsOn: _lodashFirecloud2.default.concat([`${resNs}LambdaL`], _lodashFirecloud2.default.get(Lambda, 'DependsOn', [])),
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code,
        Description: config.description,
        Environment,
        FunctionName,
        Handler: config.handler,
        MemorySize: config.memory,
        Timeout: config.timeout,
        Role, // config.role,
        Runtime: config.runtime
      }
    }, Lambda);

    return Lambda;
  });

  return function add(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

let getStorageResources = exports.getStorageResources = (() => {
  var _ref3 = (0, _bluebird.coroutine)(function* ({
    cfnDir,
    env,
    resNs
  }) {
    let partialTpl = yield (0, _build2.default)({
      env,
      dir: cfnDir,
      partial: true,
      resNs
    });

    // filter storage resources
    partialTpl.Resources = _lodashFirecloud2.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
      switch (Resource.Type) {
        case 'AWS::DynamoDB::Table':
        case 'AWS::Kinesis::Stream':
        case 'AWS::Kinesis::DeliveryStream':
        case 'AWS::S3::Bucket':
          break;
        default:
          return false;
      }
      return true;
    });

    partialTpl.Resources = _lodashFirecloud2.default.mapKeys(partialTpl.Resources, function (_value, key) {
      return `${resNs}${key}`;
    });

    return partialTpl.Resources;
  });

  return function getStorageResources(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

let getPolicyStatement = exports.getPolicyStatement = function ({ _env } = {}) {
  let Statement = [];

  Statement.push({
    Sid: 'Allow write access to logs',
    Effect: 'Allow',
    Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
    Resource: 'arn:aws:logs:*:*:*'
  });

  return Statement;
};

let getPolicy = exports.getPolicy = function ({ env }) {
  let Policy = {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      Description: `${env.ENV_NAME}: API Lambda Policy`,
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: exports.getPolicyStatement({ env })
      }
    }
  };

  return Policy;
};

let getRole = exports.getRole = function ({ env }) {
  let Role = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: (0, _principal.get)({
            env,
            service: 'lambda'
          }),
          Action: 'sts:AssumeRole'
        }]
      },
      ManagedPolicyArns: []
    }
  };

  return Role;
};

//# sourceMappingURL=lambda.js.map