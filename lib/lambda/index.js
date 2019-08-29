"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.bootstrap = exports.getRequestInstance = exports._bootstrap = exports._cleanup = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));

var _inspect = _interopRequireDefault(require("./inspect"));

var _envCtx = require("./env-ctx");



var _logger = require("./logger");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let _cleanup = async function ({ ctx }) {
  if (global && global.gc) {
    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 15, column: 11 } },
        'Garbage collection on demand...',
        async function () {
          global.gc();
        });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());

  }
};exports._cleanup = _cleanup;

let _bootstrap = async function (fn, e, ctx, pkg) {
  // temporary logger
  (0, _logger.setup)({ ctx });

  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 28, column: 9 } },
      'Merging env ctx...',
      async function () {
        await (async createError => {try {return await (0, _envCtx.merge)({ e, ctx, pkg });} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
      });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());


  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 35, column: 9 } },
      'Setting up logger...',
      async function () {
        (0, _logger.setup)({ ctx });
        ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 39, column: 7 } }, `Logger started with level=${ctx.log.level()}`, {
          e,
          ctx });

      });} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());


  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 46, column: 9 } },
      'Inspecting...',
      async function () {
        await (async createError => {try {return await (0, _inspect.default)({ e, ctx });} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());
      });} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());


  let result;
  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 54, column: 9 } },
      'Running fn...',
      async function () {
        result = await (async createError => {try {return await fn(e, ctx);} catch (_awaitTraceErr8) {let err = createError();_awaitTraceErr8.stack += "\n...\n" + err.stack;throw _awaitTraceErr8;}})(() => new Error());
        await (async createError => {try {return await ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.js" : __filename, babelFile: "src/lambda/index.js", line: 58, column: 13 } }, 'Fn result:', {
              result });} catch (_awaitTraceErr9) {let err = createError();_awaitTraceErr9.stack += "\n...\n" + err.stack;throw _awaitTraceErr9;}})(() => new Error());

      });} catch (_awaitTraceErr7) {let err = createError();_awaitTraceErr7.stack += "\n...\n" + err.stack;throw _awaitTraceErr7;}})(() => new Error());


  // don't wait for cleanup on purpose
  exports._cleanup({ ctx });

  return result;
};exports._bootstrap = _bootstrap;

let getRequestInstance = function (req) {
  let {
    ctx } =
  req;
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};exports.getRequestInstance = getRequestInstance;

let bootstrap = function (fn, {
  pkg })
{
  process.on('uncaughtException', function (err) {
    // eslint-disable-next-line no-console
    console.error('FATAL uncaughtException');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  process.on('unhandledRejection', function (err) {
    // eslint-disable-next-line no-console
    console.error('FATAL unhandledRejection');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  return async function (e, ctx, awsNext) {
    try {
      let result = await (async createError => {try {return await exports._bootstrap(fn, e, ctx, pkg);} catch (_awaitTraceErr10) {let err = createError();_awaitTraceErr10.stack += "\n...\n" + err.stack;throw _awaitTraceErr10;}})(() => new Error());
      return awsNext(undefined, result);
    } catch (err) {
      // proxying the err to awsNext would not reset state (kill lambda)
      // return awsNext(err);

      // eslint-disable-next-line no-console
      console.error('FATAL try-catch-lambda-bootstrap');
      // eslint-disable-next-line no-console
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  };
};exports.bootstrap = bootstrap;var _default =

exports;exports.default = _default;

//# sourceMappingURL=index.js.map