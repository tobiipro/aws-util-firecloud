"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.merge = exports._getAndRefresh = exports._get = exports._getResolver = void 0;

var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable import/prefer-default-export */







/*
                                                                                                                                                                                                           ctx = {
                                                                                                                                                                                                             functionName: undefined,
                                                                                                                                                                                                             functionVersion: undefined,
                                                                                                                                                                                                             invokedFunctionArn: undefined,
                                                                                                                                                                                                             memoryLimitInMB: undefined,
                                                                                                                                                                                                             awsRequestId: undefined,
                                                                                                                                                                                                             logGroupName: undefined,
                                                                                                                                                                                                             logStreamName: undefined,
                                                                                                                                                                                                             identity: {},
                                                                                                                                                                                                             // From X-Amz-Client-Context (HTTP Request Header)
                                                                                                                                                                                                             // For inspiration see
                                                                                                                                                                                                             // http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
                                                                                                                                                                                                             clientContext: {},
                                                                                                                                                                                                             // LAMBDA-HTTP CUSTOM
                                                                                                                                                                                                             // e.stageVariables + process.env
                                                                                                                                                                                                             env: {}
                                                                                                                                                                                                           }
                                                                                                                                                                                                         
                                                                                                                                                                                                           identity = {
                                                                                                                                                                                                             cognitoIdentityPoolId: undefined,
                                                                                                                                                                                                             accountId: undefined,
                                                                                                                                                                                                             cognitoIdentityId: undefined,
                                                                                                                                                                                                             caller: undefined,
                                                                                                                                                                                                             apiKey: undefined,
                                                                                                                                                                                                             sourceIp: undefined,
                                                                                                                                                                                                             cognitoAuthenticationType: undefined,
                                                                                                                                                                                                             cognitoAuthenticationProvider: undefined,
                                                                                                                                                                                                             userArn: undefined,
                                                                                                                                                                                                             userAgent: undefined,
                                                                                                                                                                                                             user: undefined
                                                                                                                                                                                                           }
                                                                                                                                                                                                         */

let _getResolver = function ({
  ctx,
  tags = [
  'default'] })




{
  let {
    env } =
  ctx;

  return _lodashFirecloud.default.join([
  env.AWS_ACCOUNT_ID,
  env.AWS_LAMBDA_FUNCTION_ALIAS,
  env.AWS_LAMBDA_FUNCTION_NAME,
  env.AWS_REGION,
  env.ENV_NAME,
  ...tags]);

};exports._getResolver = _getResolver;

let _get = function () {
  let fn = async function ({ ctx, tags })


  {
    let {
      env } =
    ctx;

    let s3 = new _awsSdk.default.S3({
      region: env.AWS_REGION,
      signatureVersion: 'v4' });


    let Body;

    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/env-ctx.ts" : __filename, babelFile: "src/lambda/env-ctx.ts", line: 85, column: 11 } }, 'aws-util-firecloud.lambda._get: Fetching env ctx...', async function () {
          let result = await (async createError => {try {return await s3.getObject({
                Bucket: env.S3_CONFIG_BUCKET,
                Key: `${env.ENV_NAME}.json` }).
              promise();} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());

          ({
            Body } =
          result);
        });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
    Body = JSON.parse(Body.toString());

    let newCtx = {};
    _lodashFirecloud.default.forEach(tags, function (tag) {
      newCtx = _lodashFirecloud.default.merge(newCtx, _lodashFirecloud.default.defaultTo(Body[tag], {}));
    });

    return newCtx;
  };

  let memoizedFn = _lodashFirecloud.default.memoizeTtl(60 * 1000, fn, exports._getResolver);
  return memoizedFn;
}();exports._get = _get;

let _getAndRefresh = async function (...args) {
  let cacheKey = exports._getResolver(...args);
  if (exports._get.cache.has(cacheKey)) {
    let {
      value,
      expires } =
    exports._get.cache.get(cacheKey);

    if (expires <= Date.now()) {
      // schedule a refresh
      _lodashFirecloud.default.defer(_lodashFirecloud.default.asyncCb(async function () {
        await (async createError => {try {return await exports._get(...args);} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
      }));
    }

    return value;
  }

  return await (async createError => {try {return await exports._get(...args);} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());
};exports._getAndRefresh = _getAndRefresh;

let merge = async function ({ e, ctx, pkg })







{
  let AWS_ACCOUNT_ID =
  _lodashFirecloud.default.split(_lodashFirecloud.default.get(ctx, 'invokedFunctionArn', ''), ':')[4];
  AWS_ACCOUNT_ID =
  _lodashFirecloud.default.defaultTo(_lodashFirecloud.default.get(e, 'requestContext.accountId'), AWS_ACCOUNT_ID);

  let AWS_REGION =
  _lodashFirecloud.default.split(_lodashFirecloud.default.get(ctx, 'invokedFunctionArn', ''), ':')[3];

  let pkgNameRE = _lodashFirecloud.default.replace(pkg.name, /([.-])/, '\\$1');
  let ENV_NAME =
  _lodashFirecloud.default.split(_lodashFirecloud.default.get(ctx, 'invokedFunctionArn', ''), ':')[6];
  ENV_NAME = _lodashFirecloud.default.replace(ENV_NAME, new RegExp(`\\-${pkgNameRE}$`), '');

  let AWS_LAMBDA_FUNCTION_NAME =
  _lodashFirecloud.default.split(_lodashFirecloud.default.get(ctx, 'invokedFunctionArn', ''), ':')[6];

  let AWS_LAMBDA_FUNCTION_ALIAS =
  _lodashFirecloud.default.split(_lodashFirecloud.default.get(ctx, 'invokedFunctionArn', ''), ':')[7];
  AWS_LAMBDA_FUNCTION_ALIAS = _lodashFirecloud.default.defaultTo(AWS_LAMBDA_FUNCTION_ALIAS, '$LATEST');

  _lodashFirecloud.default.defaultsDeep(ctx, {
    env: e.stageVariables },
  {
    env: {
      AWS_ACCOUNT_ID,
      AWS_LAMBDA_FUNCTION_ALIAS,
      AWS_LAMBDA_FUNCTION_NAME,
      AWS_REGION,
      ENV_NAME } },

  {
    env: e.stageVariables },
  {
    env: {
      // AWS does not allow empty-string stage variables...
      API_BASE_PATH: '',
      API_SECONDARY_BASE_PATH: '' } },

  {
    env: process.env });


  let envCtx = await (async createError => {try {return await exports._getAndRefresh({
        ctx,
        tags: [
        'lambdas',
        `lambdas/${pkg.name}`] });} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());


  _lodashFirecloud.default.defaultsDeep(ctx, envCtx);
};exports.merge = merge;

//# sourceMappingURL=env-ctx.js.map