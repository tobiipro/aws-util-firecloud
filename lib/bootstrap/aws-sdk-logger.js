"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports._stdErrConsole = void 0;var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _logger = _interopRequireDefault(require("../logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// eslint-disable-next-line no-console
let _stdErrConsole = new console.Console({
  stdout: process.stderr,
  stderr: process.stderr });exports._stdErrConsole = _stdErrConsole;


_awsSdk.default.config.logger = {
  isTTY: false,
  log: function (awsSdkMessage) {
    return (0, _logger.default)(awsSdkMessage, exports._stdErrConsole);
  } };

//# sourceMappingURL=aws-sdk-logger.js.map