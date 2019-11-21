"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.bootstrap = exports._bootstrap = exports._bootstrapLayer = void 0;
var _layer = _interopRequireDefault(require("express/lib/router/layer"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _express2 = _interopRequireDefault(require("express"));
var _expressBearerToken = _interopRequireDefault(require("express-bearer-token"));
var _cors = _interopRequireDefault(require("cors"));
var _http = _interopRequireDefault(require("http"));
var _middlewares = _interopRequireDefault(require("./middlewares"));
var _responseTime = _interopRequireDefault(require("response-time"));

var _lambda = require("../lambda");



var _httpLambda = require("http-lambda");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable no-invalid-this */



let _bootstrapLayer = function () {
  // override Layer.prototype as defined in express@4.16.4
  _layer.default.prototype.handle_error = async function (error, req, res, next) {
    let fn = this.handle;

    if (fn.length !== 4) {
      // not a standard error handler
      return next(error);
    }

    try {
      // original code
      // fn(error, req, res, next);
      await (async createError => {try {return await fn(error, req, res, next);} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
    } catch (err) {
      return next(err);
    }
  };

  _layer.default.prototype.handle_request = async function (req, res, next) {
    let fn = this.handle;

    if (fn.length > 3) {
      // not a standard request handler
      return next();
    }

    try {
      // original code
      // fn(req, res, next);
      await (async createError => {try {return await fn(req, res, next);} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
    } catch (err) {
      return next(err);
    }
  };
};exports._bootstrapLayer = _bootstrapLayer;

let _bootstrap = async function (fn, e, ctx) {
  exports._bootstrapLayer();
  let app = (0, _express2.default)(e);

  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.set('json spaces', 2);

  let defaultMiddlewares = {};
  defaultMiddlewares.responseTime = (0, _responseTime.default)();
  defaultMiddlewares.cors = (0, _cors.default)({
    exposedHeaders: [
    'date',
    'etag',
    'link',
    'location',
    'x-response-time'],

    maxAge: 24 * 60 * 60 // 24 hours
  });
  defaultMiddlewares.bearerToken = (0, _expressBearerToken.default)();
  defaultMiddlewares.applyMixins = _middlewares.default.applyMixins();
  defaultMiddlewares.xForward = _middlewares.default.xForward();
  defaultMiddlewares.noCache = function (_req, res, next) {
    res.set('cache-control', 'max-age=0, no-store');
    next();
  };

  _lodashFirecloud.default.forEach(defaultMiddlewares, function (middleware, name) {
    middleware.disable = function () {
      defaultMiddlewares[name] = function (_req, _res, next) {
        next();
      };
    };

    app.use(function (req, res, next) {
      defaultMiddlewares[name](req, res, next);
    });
  });

  app.defaultMiddlewares = defaultMiddlewares;

  await (async createError => {try {return await fn(app, e, ctx);} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());

  // error handlers need to be registered last
  app.use(_middlewares.default.handleResponseError());

  return app;
};exports._bootstrap = _bootstrap;

let bootstrap = function (fn, {
  pkg })
{
  return (0, _lambda.bootstrap)(async function (e, ctx) {
    let app;
    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.js" : __filename, babelFile: "src/express/index.js", line: 112, column: 11 } },
        'Creating express app...',
        async function () {
          app = await (async createError => {try {return await exports._bootstrap(fn, e, ctx);} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());
        });} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());


    let result;
    await (async createError => {try {return await ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.js" : __filename, babelFile: "src/express/index.js", line: 120, column: 11 } }, `Handling ${e.httpMethod} ${e.path}...`);} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());
    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.js" : __filename, babelFile: "src/express/index.js", line: 121, column: 11 } },
        'Creating HTTP server (handling request)...',
        _lodashFirecloud.default.promisify(function (done) {
          let http = new _httpLambda.LambdaHttp(e, ctx, function (err, resData) {
            if (_lodashFirecloud.default.isUndefined(err)) {
              result = resData;
            }
            done(err);
          });
          http.createServer(app);
        }));} catch (_awaitTraceErr7) {let err = createError();_awaitTraceErr7.stack += "\n...\n" + err.stack;throw _awaitTraceErr7;}})(() => new Error());


    await (async createError => {try {return await ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.js" : __filename, babelFile: "src/express/index.js", line: 134, column: 11 } }, `Handled with ${result.statusCode} ${_http.default.STATUS_CODES[result.statusCode]}...`);} catch (_awaitTraceErr8) {let err = createError();_awaitTraceErr8.stack += "\n...\n" + err.stack;throw _awaitTraceErr8;}})(() => new Error());
    return result;
  }, {
    pkg });

};exports.bootstrap = bootstrap;var _default =

exports;exports.default = _default;

//# sourceMappingURL=index.js.map