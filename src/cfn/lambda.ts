import _ from 'lodash-firecloud';
import _getCodeChecksumVariables from './lambda.get-code-checksum-variables';
import _getCodeChecksums from './lambda.get-code-checksums';

import {
  get as getPrincipal
} from '../principal';

import {
  Env
} from '../types';

export let getCodeChecksumVariables = _getCodeChecksumVariables;

export let getCodeChecksums = _getCodeChecksums;

export let getPolicyStatement = function({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  env
}: {
  env?: Env;
} = {}) {
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

export let getPolicy = function({
  env
}: {
  env?: Env;
}) {
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

export let getLogGroup = function({functionName, _env}) {
  let LogGroup = {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${functionName}`,
      RetentionInDays: 7
    }
  };

  return LogGroup;
};

export let maybeReuseCode = async function({
  Lambda,
  env
}) {
  let codeChecksumVariables = await getCodeChecksumVariables({
    Code: Lambda.Properties.Code,
    FunctionName: Lambda.Properties.FunctionName,
    env
  });

  _.merge(Lambda, {
    Properties: {
      Code: {
        S3Bucket: codeChecksumVariables.LAMBDA_CODE_S3BUCKET,
        S3Key: codeChecksumVariables.LAMBDA_CODE_S3KEY
      },
      Environment: {
        Variables: codeChecksumVariables
      }
    }
  });
};
