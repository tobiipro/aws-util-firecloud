"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.current = exports.get = void 0;var _env = _interopRequireDefault(require("./env"));
var _logger = _interopRequireDefault(require("./logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let get = function ({ env }) {
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger: _logger.default };

};exports.get = get;

let current = exports.get({ env: _env.default });exports.current = current;var _default =

exports;exports.default = _default;

//# sourceMappingURL=config.js.map