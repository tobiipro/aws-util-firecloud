"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.getCodeChecksumVariables = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _lambda = _interopRequireDefault(require("./lambda.get-code-checksums"));

var _config = require("../config");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let getCodeChecksumVariables = async function ({
  Code,
  FunctionName,
  env,
  force = false })
{
  let LAMBDA_CODE_S3BUCKET = Code.S3Bucket;
  let LAMBDA_CODE_S3KEY = Code.S3Key;

  let [
  LAMBDA_CODE_SHA256SUM,
  LAMBDA_CODE_SHA256SUM_CORE] = await (async createError => {try {return (
        await (0, _lambda.default)({
          env,
          Code }));} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  let codeChecksumVariables = {
    LAMBDA_CODE_SHA256SUM,
    LAMBDA_CODE_SHA256SUM_CORE,
    LAMBDA_CODE_S3BUCKET,
    LAMBDA_CODE_S3KEY };


  if (force) {
    return codeChecksumVariables;
  }

  if (!LAMBDA_CODE_SHA256SUM_CORE) {
    return codeChecksumVariables;
  }

  let liveVariables;

  // check if lambda code is the same as the current version
  try {
    let lambda = new _awsSdk.default.Lambda((0, _config.get)({ env }));
    ({
      Environment: {
        Variables: liveVariables } } = await (async createError => {try {return (

          await lambda.getFunctionConfiguration({
            FunctionName }).
          promise());} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error()));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      FunctionName });

    return codeChecksumVariables;
  }

  if (_lodashFirecloud.default.isUndefined(liveVariables.LAMBDA_CODE_S3BUCKET) ||
  _lodashFirecloud.default.isUndefined(liveVariables.LAMBDA_CODE_S3KEY)) {
    // cannot compare, so update
    return codeChecksumVariables;
  }

  if (liveVariables.LAMBDA_CODE_SHA256SUM_CORE !== LAMBDA_CODE_SHA256SUM_CORE) {
    // change detect, so update
    return codeChecksumVariables;
  }

  // no code change detected, so don't update
  return _lodashFirecloud.default.pick(liveVariables, [
  'LAMBDA_CODE_S3BUCKET',
  'LAMBDA_CODE_S3KEY',
  'LAMBDA_CODE_SHA256SUM',
  'LAMBDA_CODE_SHA256SUM_CORE']);

};exports.getCodeChecksumVariables = getCodeChecksumVariables;var _default = exports.getCodeChecksumVariables;exports.default = _default;

//# sourceMappingURL=lambda.get-code-checksum-variables.js.map