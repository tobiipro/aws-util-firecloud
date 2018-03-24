'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.allowAccessToAthenaOutputBucket = exports.allowQueryAccessToAthena = exports.allowFullAccessToKinesisStream = exports.allowFullAccessToDynamoDbTable = exports.compactStatement = exports.addStatementFromArns = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _account = require('../account');

var _account2 = _interopRequireDefault(_account);

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _athena = require('../athena');

var _config = require('../config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// workaround for AWS's limit of 10 Managed Policies per Group
// ref http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-limits.html
let addStatementFromArns = exports.addStatementFromArns = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    Statement,
    arns,
    env
  }) {
    let iam = new _awsSdk2.default.IAM((0, _config.get)({ env }));

    let arnStatement = yield Promise.all(_lodashFirecloud2.default.map(arns, (() => {
      var _ref2 = (0, _bluebird.coroutine)(function* (PolicyArn) {
        let { Policy } = yield iam.getPolicy({
          PolicyArn
        }).promise();
        let { PolicyVersion } = yield iam.getPolicyVersion({
          PolicyArn,
          VersionId: Policy.DefaultVersionId
        }).promise();
        let stmts = JSON.parse(unescape(PolicyVersion.Document)).Statement;
        stmts = _lodashFirecloud2.default.map(stmts, function (stmt, index) {
          if (stmts.length === 0) {
            index = '';
          }
          stmt = _lodashFirecloud2.default.merge({
            Sid: _lodashFirecloud2.default.defaultTo(stmt.Sid,
            // `${Policy.PolicyName}${PolicyVersion.VersionId}${index + 1}`
            `${index + 1}${PolicyVersion.VersionId}${Policy.PolicyName}`)
          }, stmt);
          return stmt;
        });
        return stmts;
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    })()));

    arnStatement = _lodashFirecloud2.default.flatten(arnStatement);

    return Statement.concat(arnStatement);
  });

  return function addStatementFromArns(_x) {
    return _ref.apply(this, arguments);
  };
})();

let compactStatement = exports.compactStatement = function ({ Statement }) {
  let map = {};
  _lodashFirecloud2.default.forEach(Statement, function (stmt) {
    stmt.Resource = _lodashFirecloud2.default.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
    let key = JSON.stringify([stmt.Effect, stmt.Principal, stmt.Resource, stmt.Condition]);
    map[key] = map[key] || [];
    map[key].push(stmt);
  });
  let cStatement = _lodashFirecloud2.default.map(map, function (stmts) {
    let {
      Effect,
      Principal,
      Resource,
      Condition
    } = stmts[0];
    let Action = _lodashFirecloud2.default.sortBy(_lodashFirecloud2.default.uniq(_lodashFirecloud2.default.flatten(_lodashFirecloud2.default.map(stmts, function (stmt) {
      return _lodashFirecloud2.default.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
    }))));
    return {
      Effect,
      Principal,
      Action,
      Resource,
      Condition
    };
  });
  _lodashFirecloud2.default.forEach(cStatement, function (stmt) {
    let wActions = _lodashFirecloud2.default.filter(stmt.Action, /\*$/);
    _lodashFirecloud2.default.forEach(wActions, function (wAction) {
      let prefix = _lodashFirecloud2.default.replace(wAction, /\*$/, '');
      _lodashFirecloud2.default.remove(stmt.Action, function (action) {
        return action !== wAction && _lodashFirecloud2.default.startsWith(action, prefix);
      });
    });
  });
  return cStatement;
};

let allowFullAccessToDynamoDbTable = exports.allowFullAccessToDynamoDbTable = function ({
  TableName,
  env
}) {
  return {
    Sid: `Allow full access to ${TableName} database`,
    Effect: 'Allow',
    Action: ['dynamodb:*'],
    Resource: [`arn:aws:dynamodb:${env.AWS_REGION}:${_account2.default.ID}:table/${TableName}`, `arn:aws:dynamodb:${env.AWS_REGION}:${_account2.default.ID}:table/${TableName}/index/*`]
  };
};

let allowFullAccessToKinesisStream = exports.allowFullAccessToKinesisStream = function ({
  StreamName,
  env
}) {
  return {
    Sid: `Allow full access to ${StreamName} stream`,
    Effect: 'Allow',
    Action: ['kinesis:*'],
    Resource: [`arn:aws:kinesis:${env.AWS_REGION}:${_account2.default.ID}:stream/${StreamName}`]
  };
};

let allowQueryAccessToAthena = exports.allowQueryAccessToAthena = function ({
  _env
} = {}) {
  return {
    Sid: `Allow query access to Athena`,
    Effect: 'Allow',
    Action: ['athena:GetQueryExecution', 'athena:GetQueryResults', 'athena:StartQueryExecution'],
    Resource: ['*']
  };
};

let allowAccessToAthenaOutputBucket = exports.allowAccessToAthenaOutputBucket = function ({
  region,
  BucketName,
  env
}) {
  BucketName = _lodashFirecloud2.default.defaultTo(BucketName, (0, _athena.getOutputBucketName)({ env, region }));

  return {
    Sid: `Allow access to ${BucketName} (Athena output) bucket`,
    Effect: 'Allow',
    Action: ['s3:GetObject', 's3:PutObject', 's3:GetBucketLocation'],
    Resource: [`arn:aws:s3:::${BucketName}`, `arn:aws:s3:::${BucketName}/*`]
  };
};

//# sourceMappingURL=iam.js.map