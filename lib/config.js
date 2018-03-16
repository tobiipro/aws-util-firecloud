'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.current = exports.get = undefined;

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let get = exports.get = function ({ env }) {
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger: _logger2.default
  };
};

let current = exports.current = exports.get({ env: _env2.default });

exports.default = exports;

//# sourceMappingURL=config.js.map