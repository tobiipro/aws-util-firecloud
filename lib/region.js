"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.currentProxy = exports.current = exports.getDomain = exports.get = exports.regions = exports.chinaRegions = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _env = _interopRequireDefault(require("./env"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}






let chinaRegions = [
'cn-north-1',
'cn-northwest-1'];exports.chinaRegions = chinaRegions;


let regions = [
// Asia Pacific
'ap-northeast-1',
'ap-northeast-2',
'ap-south-1',
'ap-southeast-1',
'ap-southeast-2',

// Canada
'ca-central-1',

// EU
'eu-central-1',
'eu-west-1',
'eu-west-2',
'eu-west-3',

// South America
'sa-east-1',

// US East
'us-east-1',
'us-east-2',

// US West
'us-west-1',
'us-west-2'];exports.regions = regions;


let get = function ({ env })

{
  return env.AWS_REGION;
};exports.get = get;

let getDomain = function ({ env, region })


{
  region = _lodashFirecloud.default.defaultTo(region, exports.get({ env }));
  let domain = 'amazonaws.com';

  if (_lodashFirecloud.default.has(exports.chinaRegions, region)) {
    domain = 'amazonaws.com.cn';
  }

  return domain;
};exports.getDomain = getDomain;

let current;

// lazy init
// eslint-disable-next-line fp/no-proxy
exports.current = current;let currentProxy = new Proxy({}, {
  get: function (_target, property, _receiver) {
    if (_lodashFirecloud.default.isUndefined(exports.current)) {
      exports.current = current = exports.get({ env: _env.default });
    }

    return exports.current[property];
  } });exports.currentProxy = currentProxy;var _default = exports.currentProxy;exports.default = _default;

//# sourceMappingURL=region.js.map