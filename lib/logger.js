"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.logger = exports._logger = exports._awsLoggerRE = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let _awsLoggerRE =
/ *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;exports._awsLoggerRE = _awsLoggerRE;

let _logger = function (awsSdkMessage, rawLogger) {
  let [
  serviceIdentifier,
  status,
  delta,
  retryCount,
  operation,
  params] =
  exports._awsLoggerRE.exec(awsSdkMessage).slice(1);

  try {
    // 'params' is essentially an output of util.format('%o', realParams)
    // remove the hidden property 'length' of arrays, so we can eval params back into realParams
    let paramsWithoutArrayLength = _lodashFirecloud.default.replace(params, /,?\s+\[length\]:\s+\d+(\s+\])/g, '$1');
    // eslint-disable-next-line no-eval
    params = eval(`(${paramsWithoutArrayLength})`);
  } catch (err) {
    rawLogger.warn("Couldn't eval 'params' of AWS SDK call.", {
      err,
      awsSdkMessage,
      params });

  }

  rawLogger.info('Making an AWS SDK call.', {
    aws: {
      serviceIdentifier,
      status,
      delta,
      retryCount,
      operation,
      params } });


};exports._logger = _logger;

let logger = function (awsSdkMessage, rawLogger = console) {
  try {
    exports._logger(awsSdkMessage, rawLogger);
  } catch (err) {
    rawLogger.error('Failed while tracing AWS SDK call.', {
      err,
      awsSdkMessage });

  }
};exports.logger = logger;var _default = exports.logger;exports.default = _default;

//# sourceMappingURL=logger.js.map