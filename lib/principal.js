"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.get = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));

var _region = require("./region");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let get = function ({
  env,
  region,
  service })
{
  let domain = (0, _region.getDomain)({ env, region });

  return {
    Service: `${service}.${domain}` };

};exports.get = get;var _default =

exports;exports.default = _default;

//# sourceMappingURL=principal.js.map