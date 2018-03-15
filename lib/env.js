'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.env = exports.current = exports.envProxy = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let envProxy = exports.envProxy = function ({ env }) {
  // eslint-disable-next-line fp/no-proxy
  return new Proxy(env, {
    get: function (target, property, _receiver) {
      if (property === '_') {
        return target;
      }
      if (!_lodashFirecloud2.default.isString(target[property])) {
        throw new Error(`env.${property} is undefined.`);
      }
      return target[property];
    }
  });
};

let current = exports.current = exports.envProxy({ env: process.env });

// backward compat alias
let env = exports.env = current;

exports.default = current;

//# sourceMappingURL=env.js.map