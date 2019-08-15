import _ from 'lodash-firecloud';
import getCodeChecksumVariables from './lambda.get-code-checksum-variables';

export let maybeReuseCode = async function({
  Lambda,
  env
}) {
  // diffs from add
  // - FunctionName is required
  // - LambdaL resource is required
  // - DependsOn is required to include LambdaL
  // - APEX_FUNCTION_NAME: pkg.name,
  // - LAMBDA_FUNCTION_NAME: Lambda.Properties.FunctionName

  // TODO needs to be in cfn/tpl/env-api/lambda.apex.js
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

export default maybeReuseCode;
