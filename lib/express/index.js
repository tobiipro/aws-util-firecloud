"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.bootstrap = exports._bootstrap = exports._bootstrapLayer = void 0;


var middlewares = _interopRequireWildcard(require("./middlewares"));
var _layer = _interopRequireDefault(require("express/lib/router/layer"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _express2 = _interopRequireDefault(require("express"));


var _expressBearerToken = _interopRequireDefault(require("express-bearer-token"));
var _cors = _interopRequireDefault(require("cors"));
var _http = _interopRequireDefault(require("http"));
var _responseTime = _interopRequireDefault(require("response-time"));

var _lambda = require("../lambda");













var _httpLambda = require("http-lambda");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _getRequireWildcardCache() {if (typeof WeakMap !== "function") return null;var cache = new WeakMap();_getRequireWildcardCache = function () {return cache;};return cache;}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache();if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;} /* eslint-disable import/prefer-default-export */ /* eslint-disable no-invalid-this */



let _bootstrapLayer = function () {
  // override Layer.prototype as defined in express@4.16.4
  // eslint-disable-next-line max-params
  _layer.default.prototype.handle_error = async function (

  error,
  req,
  res,
  next)
  {
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

  // eslint-disable-next-line max-params
  _layer.default.prototype.handle_request = async function (

  req,
  res,
  next)
  {
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

let _bootstrap = async function (
fn,
e,
ctx)
{
  exports._bootstrapLayer();
  let app = (0, _express2.default)();

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
  defaultMiddlewares.applyMixins = middlewares.applyMixins();
  defaultMiddlewares.xForward = middlewares.xForward();
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
  app.use(middlewares.handleResponseError());

  return app;
};exports._bootstrap = _bootstrap;

let bootstrap = function (


fn, {
  pkg })


{
  // @ts-ignore
  return (0, _lambda.bootstrap)(
  async function (e, ctx) {
    let app;
    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.ts" : __filename, babelFile: "src/express/index.ts", line: 150, column: 13 } },
        'Creating express app...',
        async function () {
          app = await (async createError => {try {return await exports._bootstrap(fn, e, ctx);} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());
        });} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());


    let result;
    ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.ts" : __filename, babelFile: "src/express/index.ts", line: 158, column: 7 } }, `Handling ${e.httpMethod} ${e.path}...`);
    await (async createError => {try {return await ctx.log.trackTime({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.ts" : __filename, babelFile: "src/express/index.ts", line: 159, column: 13 } },
        'Creating HTTP server (handling request)...',
        _lodashFirecloud.default.promisify(function (done) {
          let http = new _httpLambda.LambdaHttp(e, ctx, function (err, resData) {
            if (_lodashFirecloud.default.isUndefined(err)) {
              result = resData;
            }
            done(err);
          });
          http.createServer(app);
        }));} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());


    ctx.log.info({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/index.ts" : __filename, babelFile: "src/express/index.ts", line: 172, column: 7 } }, `Handled with ${result.statusCode} ${_http.default.STATUS_CODES[result.statusCode]}...`);
    return result;
  }, {
    pkg });

};exports.bootstrap = bootstrap;

//# sourceMappingURL=index.js.map