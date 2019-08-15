"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.maybeReuseCode = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _lambda = _interopRequireDefault(require("./lambda.get-code-checksum-variables"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let maybeReuseCode = async function ({
  Lambda,
  env })
{
  // diffs from add
  // - FunctionName is required
  // - LambdaL resource is required
  // - DependsOn is required to include LambdaL
  // - APEX_FUNCTION_NAME: pkg.name,
  // - LAMBDA_FUNCTION_NAME: Lambda.Properties.FunctionName

  // TODO needs to be in cfn/tpl/env-api/lambda.apex.js
  let codeChecksumVariables = await (async createError => {try {return await (0, _lambda.default)({
        Code: Lambda.Properties.Code,
        FunctionName: Lambda.Properties.FunctionName,
        env });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  _lodashFirecloud.default.merge(Lambda, {
    Properties: {
      Code: {
        S3Bucket: codeChecksumVariables.LAMBDA_CODE_S3BUCKET,
        S3Key: codeChecksumVariables.LAMBDA_CODE_S3KEY },

      Environment: {
        Variables: codeChecksumVariables } } });



};exports.maybeReuseCode = maybeReuseCode;var _default = exports.maybeReuseCode;exports.default = _default;

//# sourceMappingURL=lambda.maybe-reuse-code.js.map