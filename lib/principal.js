"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.get = void 0;



var _region = require("./region"); /* eslint-disable import/prefer-default-export */








let get = function ({
  service,
  env,
  region })




{
  let domain = (0, _region.getDomain)({ env, region });

  return {
    Service: `${service}.${domain}` };

};exports.get = get;

//# sourceMappingURL=principal.js.map