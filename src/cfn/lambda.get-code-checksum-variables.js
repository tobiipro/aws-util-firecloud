import _ from 'lodash-firecloud';
import aws from 'aws-sdk';
import getCodeChecksums from './lambda.get-code-checksums';

import {
  get as getConfig
} from '../config';

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

  if (force) {
    return codeChecksumVariables;
  }

  if (!LAMBDA_CODE_SHA256SUM_CORE) {
    return codeChecksumVariables;
  }

  let liveVariables;

  // check if lambda code is the same as the current version
  try {
    let lambda = new aws.Lambda(getConfig({env}));
    ({
      Environment: {
        Variables: liveVariables
      }
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

  if (_.isUndefined(liveVariables.LAMBDA_CODE_S3BUCKET) ||
      _.isUndefined(liveVariables.LAMBDA_CODE_S3KEY)) {
    // cannot compare, so update
    return codeChecksumVariables;
  }

  if (liveVariables.LAMBDA_CODE_SHA256SUM_CORE !== LAMBDA_CODE_SHA256SUM_CORE) {
    // change detect, so update
    return codeChecksumVariables;
  }

  // no code change detected, so don't update
  return _.pick(liveVariables, [
    'LAMBDA_CODE_S3BUCKET',
    'LAMBDA_CODE_S3KEY',
    'LAMBDA_CODE_SHA256SUM',
    'LAMBDA_CODE_SHA256SUM_CORE'
  ]);
};

export default getCodeChecksumVariables;
