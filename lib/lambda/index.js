"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.bootstrap = exports.getRequestInstance = exports._bootstrap = exports._cleanup = exports._maybeFlushMinlog = exports._logger = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));


var _inspect = _interopRequireDefault(require("./inspect"));









var _envCtx = require("./env-ctx");



var _logger2 = require("./logger");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}







let _logger = undefined;exports._logger = _logger;

let _maybeFlushMinlog = async function () {
  if (_lodashFirecloud.default.isUndefined(exports._logger)) {
    return;
  }
  let logger = exports._logger;
  exports._logger = _logger = undefined;
  try {
    await (async createError => {try {return await logger.flush();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
  } catch (minlogFlushErr) {
    // eslint-disable-next-line no-console
    console.error('FATAL MinLog.flush');
    // eslint-disable-next-line no-console
    console.error(minlogFlushErr.stack);
  }
};exports._maybeFlushMinlog = _maybeFlushMinlog;

let _cleanup = async function ({ ctx })

{
  if (_lodashFirecloud.default.isUndefined(global.gc)) {
    return;
  }
  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 50, column: 9 } },
      'Garbage collection on demand...',
      async function () {
        global.gc();
      });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());

};

// eslint-disable-next-line max-params
exports._cleanup = _cleanup;let _bootstrap = async function (



fn,
e,
ctx,
pkg)
{
  // temporary logger
  exports._logger = _logger = (0, _logger2.setup)({ ctx });

  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 71, column: 9 } },
      'Merging env ctx...',
      async function () {
        await (async createError => {try {return await (0, _envCtx.merge)({ e, ctx, pkg });} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());
      });} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());


  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 78, column: 9 } },
      'Setting up logger...',
      async function () {
        (0, _logger2.setup)({ ctx });
        ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 82, column: 7 } }, `Logger started with level=${ctx.log.level()}`, {
          e,
          ctx });

      });} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());


  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 89, column: 9 } },
      'Inspecting...',
      async function () {
        await (async createError => {try {return await (0, _inspect.default)({ ctx });} catch (_awaitTraceErr7) {let err = createError();_awaitTraceErr7.stack += "\n...\n" + err.stack;throw _awaitTraceErr7;}})(() => new Error());
      });} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());


  let result;
  await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 97, column: 9 } },
      'Running fn...',
      async function () {
        result = await (async createError => {try {return await fn(e, ctx);} catch (_awaitTraceErr9) {let err = createError();_awaitTraceErr9.stack += "\n...\n" + err.stack;throw _awaitTraceErr9;}})(() => new Error());
        ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/index.ts" : __filename, babelFile: "src/lambda/index.ts", line: 101, column: 7 } }, 'Fn result:', {
          result });

      });} catch (_awaitTraceErr8) {let err = createError();_awaitTraceErr8.stack += "\n...\n" + err.stack;throw _awaitTraceErr8;}})(() => new Error());


  // don't wait for cleanup on purpose
  _lodashFirecloud.default.defer(async function () {
    await (async createError => {try {return await exports._cleanup({ ctx });} catch (_awaitTraceErr10) {let err = createError();_awaitTraceErr10.stack += "\n...\n" + err.stack;throw _awaitTraceErr10;}})(() => new Error());
  });

  return result;
};exports._bootstrap = _bootstrap;

let getRequestInstance = function ({ ctx })

{
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};

/* eslint-disable no-console */exports.getRequestInstance = getRequestInstance;
let bootstrap = function (


fn, {
  pkg })


{
  process.on('uncaughtException', function (err) {
    exports._maybeFlushMinlog().finally(function () {
      console.error('FATAL uncaughtException');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  });

  process.on('unhandledRejection', function (err) {
    exports._maybeFlushMinlog().finally(function () {
      console.error('FATAL unhandledRejection');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  });

  return async function (e, ctx, awsNext) {
    let result;
    let err;

    try {
      result = await (async createError => {try {return await exports._bootstrap(fn, e, ctx, pkg);} catch (_awaitTraceErr11) {let err = createError();_awaitTraceErr11.stack += "\n...\n" + err.stack;throw _awaitTraceErr11;}})(() => new Error());
    } catch (err2) {
      err = err2;
    }

    if (_lodashFirecloud.default.isDefined(exports._logger)) {
      let logger = exports._logger;
      exports._logger = _logger = undefined;
      try {
        await (async createError => {try {return await logger.flush();} catch (_awaitTraceErr12) {let err = createError();_awaitTraceErr12.stack += "\n...\n" + err.stack;throw _awaitTraceErr12;}})(() => new Error());
      } catch (minlogFlushErr) {
        console.error('FATAL MinLog.flush');
        console.error(minlogFlushErr.stack);
      }
    }

    if (_lodashFirecloud.default.isDefined(err)) {
      // proxying the err to awsNext would not reset state (kill lambda)
      // if (_.isFunction(awsNext)) {
      //   return awsNext(err);
      // } else {
      //   throw err;
      // }

      console.error('FATAL try-catch-lambda-bootstrap');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    if (_lodashFirecloud.default.isFunction(awsNext)) {
      awsNext(undefined, result);
    } else {
      return result;
    }
  };
  /* eslint-enable no-console */
};exports.bootstrap = bootstrap;

//# sourceMappingURL=index.js.map