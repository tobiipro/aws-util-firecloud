"use strict";var _awsSdk = _interopRequireDefault(require("aws-sdk"));
var _logger = _interopRequireDefault(require("../logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

_awsSdk.default.config.logger = {
  isTTY: false,
  log: _logger.default };

//# sourceMappingURL=aws-sdk-logger.js.map