"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports._stdErrConsole = void 0;var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _logger = _interopRequireDefault(require("../logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}








// eslint-disable-next-line no-console
let _stdErrConsole = new console.Console({
  stdout: process.stderr,
  stderr: process.stderr });exports._stdErrConsole = _stdErrConsole;


_awsSdk.default.config.logger = {
  isTTY: false,
  log: function (...messages) {
    // ignore the rest, aws-sdk-js only calls with one argument: awsSdkMessage
    (0, _logger.default)(messages[0], exports._stdErrConsole);
    if (messages.length > 1) {
      throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
    }
  } };

//# sourceMappingURL=aws-sdk-logger.js.map