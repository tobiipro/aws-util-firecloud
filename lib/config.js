"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.current = exports.get = void 0;
var _env = _interopRequireDefault(require("./env"));
var _logger = _interopRequireDefault(require("./logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}





let get = function ({
  env })


{
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger: {
      log: function (...messages) {
        // ignore the rest, aws-sdk-js only calls with one argument: awsSdkMessage
        (0, _logger.default)(messages[0]);
        if (messages.length > 1) {
          throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
        }
      } } };


};exports.get = get;

let current = exports.get({ env: _env.default });exports.current = current;

//# sourceMappingURL=config.js.map