"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.setup = exports._setupLongStacktraces = exports._setupAwsLogger = exports._awsLoggerRE = exports._makeCtxSerializer = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _logger = _interopRequireDefault(require("../logger"));

var _minlog = require("minlog");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}






let _makeCtxSerializer = function ({ ctx }) {
  return async function ({ entry }) {
    // minimal ctx
    _lodashFirecloud.default.merge(entry, {
      ctx: {
        awsRequestId: ctx.awsRequestId } });



    return entry;
  };
};exports._makeCtxSerializer = _makeCtxSerializer;

let _awsLoggerRE =
/^ *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(((?:.|\n)+)\)[^)]*$/;exports._awsLoggerRE = _awsLoggerRE;

let _setupAwsLogger = function ({ ctx }) {
  _awsSdk.default.config.logger = {
    isTTY: false,
    log: function (awsSdkMessage) {
      if (!ctx.log._canTrace) {
        return;
      }

      (0, _logger.default)(awsSdkMessage, ctx.log);
    } };

};exports._setupAwsLogger = _setupAwsLogger;

let _setupLongStacktraces = function ({ ctx }) {
  if (ctx.log._canTrace) {
    Error.stackTraceLimit = Infinity;

    if (_lodashFirecloud.default.isFunction(Promise.config)) {
      Promise.config({
        warnings: true,
        longStackTraces: true });

    }

    ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/logger.js" : __filename, babelFile: "src/lambda/logger.js", line: 52, column: 5 } }, 'Long stack traces enabled.');
  } else if (Error.stackTraceLimit === Infinity && /^prod/.test(process.env.NODE_ENV)) {
    ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/logger.js" : __filename, babelFile: "src/lambda/logger.js", line: 54, column: 5 } }, 'Long stack traces cannot be disabled in this lambda instance!');
  }
};exports._setupLongStacktraces = _setupLongStacktraces;

let setup = function ({ ctx }) {
  let level = _lodashFirecloud.default.get(ctx, 'env.LOG_LEVEL', 'info');

  let logger = new _minlog.MinLog({
    serializers: [
    _minlog.serializeTime,
    _minlog.serializeErr,
    exports._makeCtxSerializer({ ctx })],

    listeners: [
    (0, _minlog.logToConsoleAwsLambda)({
      level })],


    requireRawEntry: true,
    requireSrc: true });


  logger.level = function () {
    return level;
  };

  // internal convenience
  logger._canTrace = !logger.levelIsBeyondGroup('trace', level);

  ctx.log = logger;
  exports._setupAwsLogger({ ctx });
  exports._setupLongStacktraces({ ctx });
};exports.setup = setup;var _default =

exports;exports.default = _default;

//# sourceMappingURL=logger.js.map