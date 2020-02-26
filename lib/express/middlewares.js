"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.handleResponseError = exports._sendResponseError = exports.xForward = exports.applyMixins = void 0;var reqMixins = _interopRequireWildcard(require("./req-mixins"));
var resMixins = _interopRequireWildcard(require("./res-mixins"));
var _resError = _interopRequireDefault(require("./res-error"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));


var _lambda = require("../lambda");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _getRequireWildcardCache() {if (typeof WeakMap !== "function") return null;var cache = new WeakMap();_getRequireWildcardCache = function () {return cache;};return cache;}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache();if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;}








let applyMixins = function () {
  return function (req, res, next) {
    _lodashFirecloud.default.forEach(reqMixins, function (fn, name) {
      req[name] = _lodashFirecloud.default.bind(fn, req);
    });

    res.oldSend = res.send.bind(res); // required by the res.send mixin
    res.oldType = res.type.bind(res); // required by the res.type mixin
    _lodashFirecloud.default.forEach(resMixins, function (fn, name) {
      res[name] = _lodashFirecloud.default.bind(fn, res);
    });

    next();
  };
};exports.applyMixins = applyMixins;

let xForward = function () {
  return function (req, _res, next) {
    req.headers = _lodashFirecloud.default.mapKeys(req.headers, function (_value, key) {
      return _lodashFirecloud.default.replace(key, /^X-Forward-/, '');
    });

    next();
  };
};exports.xForward = xForward;

let _sendResponseError = function (res, err) {
  let {
    code: status,
    contentType,
    body } =
  err;

  body.instance = (0, _lambda.getRequestInstance)({ ctx: res.ctx });

  res.status(status);
  res.type(contentType);
  res.send(body);
};exports._sendResponseError = _sendResponseError;

let handleResponseError = function () {
  // function arity is important to distinguish to express that this is an error handler
  // eslint-disable-next-line max-params
  return async function (
  err,
  _req,
  res,
  _next)
  {
    let {
      ctx } =
    res;

    await (async createError => {try {return await ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.ts" : __filename, babelFile: "src/express/middlewares.ts", line: 69, column: 11 } }, 'Handling response error...', {
          err });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


    if (res.headersSent) {
      await (async createError => {try {return await ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.ts" : __filename, babelFile: "src/express/middlewares.ts", line: 74, column: 13 } }, "Headers already sent. Can't send error.");} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
      // bypass express' final-handler
      // return next(err);
      return res._next(err);
    }

    if (err instanceof _resError.default) {
      await (async createError => {try {return await ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.ts" : __filename, babelFile: "src/express/middlewares.ts", line: 81, column: 13 } }, `Responding with ${err.code} ${err.message}...`);} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
      exports._sendResponseError(res, err);
      return;
    }

    if (res.ctx.log._canTrace) {
      // preferrably we would like to respond with a stacktrace
      // and reset state (kill lambda), but it is impossible to do so:
      // AWS will freeze the lambda execution right after responding,
      // and kill the lambda on the subsequent request

      await (async createError => {try {return await ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.ts" : __filename, babelFile: "src/express/middlewares.ts", line: 92, column: 13 } }, 'Responding with trace...');} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());
      let internalErr = new _resError.default(500, {
        renderer: 'aws-util-firecloud',
        trace: _lodashFirecloud.default.isDefined(err.stack) ? _lodashFirecloud.default.split(err.stack, '\n') : err });

      exports._sendResponseError(res, internalErr);
      return;
    }

    // let the lambda bootstrap handle this error e.g. process.exit(1)
    // and thus reset state (kill lambda)
    // and let API Gateway respond with 502 Bad Gateway.

    // NOTE: we cannot throw, because the error will be caught
    // by express' Layer.prototype.handle_error code

    res._next(err);
  };
};exports.handleResponseError = handleResponseError;

//# sourceMappingURL=middlewares.js.map