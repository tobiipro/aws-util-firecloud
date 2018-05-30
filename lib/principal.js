'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _region = require('./region');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let get = exports.get = function ({
  env,
  region,
  service
}) {
  let domain = (0, _region.getDomain)({ env, region });

  return {
    Service: `${service}.${domain}`
  };
};

exports.default = exports;

//# sourceMappingURL=principal.js.map