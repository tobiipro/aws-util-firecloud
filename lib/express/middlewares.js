"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.handleResponseError = exports._sendResponseError = exports.xForward = exports.applyMixins = exports._resMixins = exports._reqMixins = void 0;var _resError = _interopRequireDefault(require("./res-error"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _package = _interopRequireDefault(require("../../package.json"));
var _reqMixins2 = _interopRequireDefault(require("./req-mixins"));
var _resMixins2 = _interopRequireDefault(require("./res-mixins"));

var _lambda = require("../lambda");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let _reqMixins = _lodashFirecloud.default.omit(_reqMixins2.default, 'default');exports._reqMixins = _reqMixins;
let _resMixins = _lodashFirecloud.default.omit(_resMixins2.default, 'default');exports._resMixins = _resMixins;

let applyMixins = function () {
  return function (req, res, next) {
    _lodashFirecloud.default.forEach(exports._reqMixins, function (fn, name) {
      req[name] = _lodashFirecloud.default.bind(fn, req);
    });

    res.oldSend = res.send; // required by the res.send mixin
    res.oldType = res.type; // required by the res.type mixin
    _lodashFirecloud.default.forEach(exports._resMixins, function (fn, name) {
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
  // function arity is important to distinguish to express
  // that this is an error handler
  return function (err, _req, res, _next) {
    let {
      ctx } =
    res;

    ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.js" : __filename, babelFile: "src/express/middlewares.js", line: 62, column: 5 } }, 'Handling response error...', {
      err });


    if (res.headersSent) {
      ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.js" : __filename, babelFile: "src/express/middlewares.js", line: 67, column: 7 } }, "Headers already sent. Can't send error.");
      // bypass express' final-handler
      // return next(err);
      return res._next(err);
    }

    if (err instanceof _resError.default) {
      ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.js" : __filename, babelFile: "src/express/middlewares.js", line: 74, column: 7 } }, `Responding with ${err.code} ${err.message}...`);
      exports._sendResponseError(res, err);
      return;
    }

    if (res.ctx.log._canTrace) {
      // preferrably we would like to respond with a stacktrace
      // and reset state (kill lambda), but it is impossible to do so:
      // AWS will freeze the lambda execution right after responding,
      // and kill the lambda on the subsequent request

      ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/middlewares.js" : __filename, babelFile: "src/express/middlewares.js", line: 85, column: 7 } }, 'Responding with trace...');
      let internalErr = new _resError.default(500, {
        renderer: _package.default.name,
        trace: err.stack ? _lodashFirecloud.default.split(err.stack, '\n') : err });

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
};exports.handleResponseError = handleResponseError;var _default =

exports;exports.default = _default;

//# sourceMappingURL=middlewares.js.map