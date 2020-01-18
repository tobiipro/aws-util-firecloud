"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.setup = exports._setupLongStacktraces = exports._setupAwsLogger = exports._awsLoggerRE = exports._makeCtxSerializer = void 0;

var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _logger2 = _interopRequireDefault(require("../logger"));





var _minlog = require("minlog");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable import/prefer-default-export */













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

let _setupAwsLogger = function ({ ctx })

{
  _awsSdk.default.config.logger = {
    isTTY: false,
    log: function (...messages) {
      if (!ctx.log._canTrace) {
        return;
      }

      (0, _logger2.default)(messages[0], ctx.log);
      if (messages.length > 1) {
        throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
      }
    } };

};exports._setupAwsLogger = _setupAwsLogger;

let _setupLongStacktraces = function ({ ctx })

{
  if (!ctx.log._canTrace) {
    return;
  }
  Error.stackTraceLimit = Infinity;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/logger.ts" : __filename, babelFile: "src/lambda/logger.ts", line: 67, column: 3 } }, 'Long stack traces enabled.');
};exports._setupLongStacktraces = _setupLongStacktraces;

let setup = function ({ ctx })

{
  let level = _lodashFirecloud.default.get(ctx, 'env.LOG_LEVEL', 'info');

  let _logger = new _minlog.MinLog({
    serializers: [
    (0, _minlog.serializeTime)(),
    (0, _minlog.serializeErr)(),
    exports._makeCtxSerializer({ ctx })],

    listeners: [
    (0, _minlog.logToConsoleAwsLambda)({
      level })],


    requireRawEntry: true,
    requireSrc: true });


  let logger = _lodashFirecloud.default.assign(_logger, {
    level: function () {
      return level;
    },

    // internal convenience
    _canTrace: !_logger.levelIsBeyondGroup('trace', level) });


  ctx.log = logger;
  exports._setupAwsLogger({ ctx });
  exports._setupLongStacktraces({ ctx });

  return logger;
};exports.setup = setup;

//# sourceMappingURL=logger.js.map