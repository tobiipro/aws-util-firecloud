import _ from 'lodash-firecloud';
import aws from 'aws-sdk';
import path from 'path';

import {
  get as getConfig
} from '../config';

import {
  get as getPrincipal
} from '../principal';

export let getCodeChecksums = async function({
  Code,
  algorithm = 'sha256',
  env
}) {
  let s3 = new aws.S3(getConfig({env}));

  let Bucket = Code.S3Bucket;
  let Key = `${Code.S3Key}.${algorithm}sum`;

  let getObjectResp;
  try {
    getObjectResp = await s3.getObject({
      Bucket,
      Key
    }).promise();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      Bucket,
      Key
    });
    return [];
  }

  let {
    Body
  } = getObjectResp;
  Body = Body.toString();

  let checksums = {};
  _.forEach(_.split(_.trim(Body), '\n'), function(line) {
    let [
      checksum,
      filename
    ] = _.split(line, '  ');
    checksums[filename] = checksum;
  });

  let filename = _.last(_.split(Code.S3Key, '/'));

  return [
    checksums[`${filename}.info`],
    checksums[`core.${filename}.info`]
  ];
};

export let getCodeChecksumVariables = async function({
  Code,
  FunctionName,
  env,
  force = false
}) {
  let LAMBDA_CODE_S3BUCKET = Code.S3Bucket;
  let LAMBDA_CODE_S3KEY = Code.S3Key;

  let [
    LAMBDA_CODE_SHA256SUM,
    LAMBDA_CODE_SHA256SUM_CORE
  ] = await getCodeChecksums({
    env,
    Code
  });

  let codeChecksumVariables = {
    LAMBDA_CODE_SHA256SUM,
    LAMBDA_CODE_SHA256SUM_CORE,
    LAMBDA_CODE_S3BUCKET,
    LAMBDA_CODE_S3KEY
  };

  if (!LAMBDA_CODE_SHA256SUM_CORE) {
    return codeChecksumVariables;
  }

  if (force) {
    return codeChecksumVariables;
  }

  let prevEnvironment;

  // check if lambda code is the same as the current version
  try {
    let lambda = new aws.Lambda(getConfig({env}));
    ({
      Environment: prevEnvironment
    } = await lambda.getFunctionConfiguration({
      FunctionName
    }).promise());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      FunctionName
    });
    return codeChecksumVariables;
  }

  if (!prevEnvironment.Variables.LAMBDA_CODE_S3BUCKET ||
      !prevEnvironment.Variables.LAMBDA_CODE_S3KEY) {
    return codeChecksumVariables;
  }

  let prevCode = {
    S3Bucket: prevEnvironment.Variables.LAMBDA_CODE_S3BUCKET,
    S3Key: prevEnvironment.Variables.LAMBDA_CODE_S3KEY
  };

  let [
    PREV_LAMBDA_CODE_SHA256SUM,
    PREV_LAMBDA_CODE_SHA256SUM_CORE
  ] = await getCodeChecksums({
    env,
    Code: prevCode
  });

  if (LAMBDA_CODE_SHA256SUM_CORE === PREV_LAMBDA_CODE_SHA256SUM_CORE) {
    // no real code change, so don't change lambda
    Code = prevCode;
    LAMBDA_CODE_SHA256SUM = PREV_LAMBDA_CODE_SHA256SUM;
    ({
      LAMBDA_CODE_S3BUCKET,
      LAMBDA_CODE_S3KEY
    } = prevEnvironment.Variables);

    _.merge(codeChecksumVariables, {
      LAMBDA_CODE_S3BUCKET,
      LAMBDA_CODE_S3KEY
    });
  }

  return codeChecksumVariables;
};

export let add = async function({
  Code,
  Resources,
  cfnDir,
  config,
  env,
  resNs,
  force = false
}) {
  let FunctionName =
      _.replace(config.nameTemplate, '{{.Function.Name}}', config.name);

  // eslint-disable-next-line global-require
  let partialTpl = await require(path.join(cfnDir, 'index.js')).default({
    env,
    dir: cfnDir,
    resNs
  });

  let Lambda = _.get(partialTpl, 'Resources.Lambda');
  if (Lambda) {
    delete partialTpl.Resources.Lambda;
  } else {
    Lambda = {};
  }

  _.merge(Lambda, {
    Properties: {
      Environment: {
        Variables: config.environment || {}
      }
    }
  });

  // filter out storage resources
  partialTpl.Resources = _.pickBy(partialTpl.Resources, function(Resource, _ResourceName) {
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

  partialTpl.Resources = _.mapKeys(partialTpl.Resources, function(_value, key) {
    return `${resNs}${key}`;
  });

  _.merge(Resources, partialTpl.Resources);

  Resources[`${resNs}LambdaL`] = _.defaultTo(Resources[`${resNs}LambdaL`], {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${FunctionName}`,
      RetentionInDays: 7
    }
  });

  let Role = {
    'Fn::GetAtt': [
      'LambdaR',
      'Arn'
    ]
  };

  if (Resources[`${resNs}LambdaR`]) {
    Role = {
      'Fn::GetAtt': [
        `${resNs}LambdaR`,
        'Arn'
      ]
    };
  }

  let Variables = {
    APEX_FUNCTION_NAME: config.name, // apex specific
    LAMBDA_FUNCTION_NAME: FunctionName // apex specific
  };

  let codeChecksumVariables = await getCodeChecksumVariables({
    Code,
    FunctionName,
    env,
    force
  });
  _.merge(Variables, codeChecksumVariables);

  Lambda = _.merge({
    DependsOn: _.concat([
      `${resNs}LambdaL`
    ], _.get(Lambda, 'DependsOn', [])),
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
        Variables
      }
    }
  }, Lambda);

  return Lambda;
};

export let getStorageResources = async function({
  cfnDir,
  env,
  resNs
}) {
  // eslint-disable-next-line global-require
  let partialTpl = await require(path.join(cfnDir, 'index.js')).default({
    env,
    dir: cfnDir,
    resNs
  });

  // filter storage resources
  partialTpl.Resources = _.pickBy(partialTpl.Resources, function(Resource, _ResourceName) {
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

  partialTpl.Resources = _.mapKeys(partialTpl.Resources, function(_value, key) {
    return `${resNs}${key}`;
  });

  return partialTpl.Resources;
};

export let getPolicyStatement = function({_env} = {}) {
  let Statement = [];

  Statement.push({
    Sid: 'Allow write access to logs',
    Effect: 'Allow',
    Action: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents'
    ],
    Resource: 'arn:aws:logs:*:*:*'
  });

  return Statement;
};

export let getPolicy = function({env}) {
  let Policy = {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      Description: `${env.ENV_NAME}: API Lambda Policy`,
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: getPolicyStatement({env})
      }
    }
  };

  return Policy;
};

export let getRole = function({env}) {
  let Role = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: getPrincipal({
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
