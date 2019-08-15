import _ from 'lodash-firecloud';
import _add from './lambda.add';
import _getCodeChecksumVariables from './lambda.get-code-checksum-variables';
import _getCodeChecksums from './lambda.get-code-checksums';
import _getStorageResources from './lambda.get-storage-resources';
import _maybeReuseCode from './lambda.maybe-reuse-code';

import {
  get as getPrincipal
} from '../principal';

export let add = _add;

export let getCodeChecksumVariables = _getCodeChecksumVariables;

export let getCodeChecksums = _getCodeChecksums;

export let getStorageResources = _getStorageResources;

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

export let maybeReuseCode = _maybeReuseCode;
