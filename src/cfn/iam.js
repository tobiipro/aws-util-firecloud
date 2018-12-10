import AWS_ACCOUNT from '../account';
import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  getOutputBucketName as getAthenaOutputBucketName
} from '../athena';

import {
  get as getConfig
} from '../config';

// workaround for AWS's limit of 10 Managed Policies per Group
// ref http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-limits.html
export let addStatementFromArns = async function({
  Statement,
  arns,
  env
}) {
  let iam = new aws.IAM(getConfig({env}));

  let arnStatement = await Promise.all(_.map(arns, async function(PolicyArn) {
    let {Policy} = await iam.getPolicy({
      PolicyArn
    }).promise();
    let {PolicyVersion} = await iam.getPolicyVersion({
      PolicyArn,
      VersionId: Policy.DefaultVersionId
    }).promise();
    let stmts = JSON.parse(unescape(PolicyVersion.Document)).Statement;
    stmts = _.map(stmts, function(stmt, index) {
      if (stmts.length === 0) {
        index = '';
      }
      stmt = _.merge({
        Sid: _.defaultTo(
          stmt.Sid,
          // `${Policy.PolicyName}${PolicyVersion.VersionId}${index + 1}`
          `${index + 1}${PolicyVersion.VersionId}${Policy.PolicyName}`
        )
      }, stmt);
      return stmt;
    });
    return stmts;
  }));

  arnStatement = _.flatten(arnStatement);

  return Statement.concat(arnStatement);
};

export let compactStatement = function({Statement}) {
  let map = {};
  _.forEach(Statement, function(stmt) {
    stmt.Resource = _.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
    let key = JSON.stringify([
      stmt.Effect,
      stmt.Principal,
      stmt.Resource,
      stmt.Condition
    ]);
    map[key] = map[key] || [];
    map[key].push(stmt);
  });
  let cStatement = _.map(map, function(stmts) {
    let {
      Effect,
      Principal,
      Resource,
      Condition
    } = stmts[0];
    let Action = _.sortBy(_.uniq(_.flatten(_.map(stmts, function(stmt) {
      return _.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
    }))));
    return {
      Effect,
      Principal,
      Action,
      Resource,
      Condition
    };
  });
  _.forEach(cStatement, function(stmt) {
    let wActions = _.filter(stmt.Action, /\*$/);
    _.forEach(wActions, function(wAction) {
      let prefix = _.replace(wAction, /\*$/, '');
      stmt.Action = _.reject(stmt.Action, function(action) {
        return (action !== wAction && _.startsWith(action, prefix));
      });
    });
  });
  return cStatement;
};

export let allowFullAccessToDynamoDbTable = function({
  TableName,
  env
}) {
  return {
    Sid: `Allow full access to ${TableName} database`,
    Effect: 'Allow',
    Action: [
      'dynamodb:*'
    ],
    Resource: [
      `arn:aws:dynamodb:${env.AWS_REGION}:${AWS_ACCOUNT.ID}:table/${TableName}`,
      `arn:aws:dynamodb:${env.AWS_REGION}:${AWS_ACCOUNT.ID}:table/${TableName}/index/*`
    ]
  };
};

export let allowFullAccessToKinesisStream = function({
  StreamName,
  env
}) {
  return {
    Sid: `Allow full access to ${StreamName} stream`,
    Effect: 'Allow',
    Action: [
      'kinesis:*'
    ],
    Resource: [
      `arn:aws:kinesis:${env.AWS_REGION}:${AWS_ACCOUNT.ID}:stream/${StreamName}`
    ]
  };
};

export let allowQueryAccessToAthena = function({
  _env
} = {}) {
  return {
    Sid: `Allow query access to Athena`,
    Effect: 'Allow',
    Action: [
      'athena:GetQueryExecution',
      'athena:GetQueryResults',
      'athena:StartQueryExecution'
    ],
    Resource: [
      '*'
    ]
  };
};

export let allowAccessToAthenaOutputBucket = function({
  region,
  BucketName,
  env
}) {
  BucketName =
    _.defaultTo(BucketName, getAthenaOutputBucketName({env, region}));

  return {
    Sid: `Allow access to ${BucketName} (Athena output) bucket`,
    Effect: 'Allow',
    Action: [
      's3:GetObject',
      's3:PutObject',
      's3:GetBucketLocation'
    ],
    Resource: [
      `arn:aws:s3:::${BucketName}`,
      `arn:aws:s3:::${BucketName}/*`
    ]
  };
};
