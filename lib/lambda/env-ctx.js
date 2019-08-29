"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.merge = exports._getAndRefresh = exports._get = exports._getResolver = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

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

let _get = async function ({ ctx, tags }) {
  let {
    env } =
  ctx;

  let s3 = new _awsSdk.default.S3({
    region: env.AWS_REGION,
    signatureVersion: 'v4' });


  let Body;

  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/env-ctx.js" : __filename, babelFile: "src/lambda/env-ctx.js", line: 36, column: 9 } }, 'aws-util-firecloud.lambda._get: Fetching env ctx...', async function () {
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
};exports._get = _get;
exports._get = _get = _lodashFirecloud.default.memoizeTtl(60 * 1000, exports._get, exports._getResolver);

let _getAndRefresh = async function (...args) {
  let cacheKey = exports._getResolver(...args);
  if (exports._get.cache.has(cacheKey)) {
    let {
      value,
      expires } =
    exports._get.cache.get(cacheKey);

    if (expires <= Date.now()) {
      // schedule a refresh
      exports._get(...args);
    }

    return value;
  }

  return await (async createError => {try {return await exports._get(...args);} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
};exports._getAndRefresh = _getAndRefresh;

let merge = async function ({ e, ctx, pkg }) {
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
        `lambdas/${pkg.name}`] });} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());


  _lodashFirecloud.default.defaultsDeep(ctx, envCtx);
};exports.merge = merge;var _default =

exports;exports.default = _default;

//# sourceMappingURL=env-ctx.js.map