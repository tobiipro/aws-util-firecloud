'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentProxy = exports.current = exports.getDomain = exports.get = exports.regions = exports.chinaRegions = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let chinaRegions = exports.chinaRegions = ['cn-north-1', 'cn-northwest-1'];

let regions = exports.regions = [
// Asia Pacific
'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',

// Canada
'ca-central-1',

// EU
'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',

// South America
'sa-east-1',

// US East
'us-east-1', 'us-east-2',

// US West
'us-west-1', 'us-west-2'];

let get = exports.get = function ({ env }) {
  return env.AWS_REGION;
};

let getDomain = exports.getDomain = function ({ region, env }) {
  region = _lodashFirecloud2.default.defaultTo(region, exports.get({ env }));
  let domain = 'amazonaws.com';

  if (_lodashFirecloud2.default.has(exports.chinaRegions, region)) {
    domain = 'amazonaws.com.cn';
  }

  return domain;
};

let current = exports.current = undefined;

// lazy init
// eslint-disable-next-line fp/no-proxy
let currentProxy = exports.currentProxy = new Proxy({}, {
  get: function (_target, property, _receiver) {
    if (!exports.current) {
      exports.current = current = exports.get({ env: _env2.default });
    }

    return exports.current[property];
  }
});

exports.default = exports.currentProxy;

//# sourceMappingURL=region.js.map