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

export default getCodeChecksumVariables;
