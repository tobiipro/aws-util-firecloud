"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.currentProxy = exports.current = exports.get = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _env = _interopRequireDefault(require("./env"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let get = function ({ env }) {
  let awsAccountIdVars = _lodashFirecloud.default.filter(_lodashFirecloud.default.keys(env), function (varName) {
    return /_AWS_ACCOUNT_ID$/.test(varName);
  });
  let accounts = {};

  _lodashFirecloud.default.forEach(awsAccountIdVars, function (awsAccountIdVar) {
    let prefix = _lodashFirecloud.default.replace(awsAccountIdVar, /_AWS_ACCOUNT_ID$/, '');
    let NAME = _lodashFirecloud.default.toLower(prefix);
    let ID = env[awsAccountIdVar];

    let account = {
      NAME,
      ID };


    let prefixedEnvVars = _lodashFirecloud.default.pickBy(env, function (_value, key) {
      return _lodashFirecloud.default.startsWith(key, `${prefix}_`);
    });
    prefixedEnvVars = _lodashFirecloud.default.mapKeys(prefixedEnvVars, function (_value, key) {
      return _lodashFirecloud.default.replace(key, new RegExp(`^${prefix}_`), '');
    });
    _lodashFirecloud.default.merge(account, prefixedEnvVars);

    account.NS = _lodashFirecloud.default.split(_lodashFirecloud.default.defaultTo(account.NS, ''), ',');

    accounts[ID] = account;
    accounts[prefix] = account;
    accounts[NAME] = account;
  });

  _lodashFirecloud.default.assign(accounts, accounts[env.AWS_ACCOUNT_ID]);

  return accounts;
};exports.get = get;

let current = {};

// lazy init
// eslint-disable-next-line fp/no-proxy
exports.current = current;let currentProxy = new Proxy(exports.current, {
  get: function (target, property, _receiver) {
    if (_lodashFirecloud.default.isEmpty(exports.current)) {
      _lodashFirecloud.default.merge(exports.current, exports.get({ env: _env.default }));
    }

    return target[property];
  } });exports.currentProxy = currentProxy;var _default = exports.currentProxy;exports.default = _default;

//# sourceMappingURL=account.js.map