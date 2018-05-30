'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentProxy = exports.current = exports.get = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let get = exports.get = function ({ env }) {
  let awsAccountIdVars = _lodashFirecloud2.default.filter(_lodashFirecloud2.default.keys(env._), function (varName) {
    return (/_AWS_ACCOUNT_ID$/.test(varName)
    );
  });
  let accounts = {};

  _lodashFirecloud2.default.forEach(awsAccountIdVars, function (awsAccountIdVar) {
    let prefix = _lodashFirecloud2.default.replace(awsAccountIdVar, /_AWS_ACCOUNT_ID$/, '');
    let NAME = _lodashFirecloud2.default.toLower(prefix);
    let ID = env[awsAccountIdVar];

    let account = {
      NAME,
      ID
    };

    let prefixedEnvVars = _lodashFirecloud2.default.pickBy(env._, function (_value, key) {
      return _lodashFirecloud2.default.startsWith(key, `${prefix}_`);
    });
    prefixedEnvVars = _lodashFirecloud2.default.mapKeys(prefixedEnvVars, function (_value, key) {
      return _lodashFirecloud2.default.replace(key, new RegExp(`^${prefix}_`), '');
    });
    _lodashFirecloud2.default.merge(account, prefixedEnvVars);

    account.NS = _lodashFirecloud2.default.split(_lodashFirecloud2.default.defaultTo(account.NS, ''), ',');

    accounts[ID] = account;
    accounts[prefix] = account;
    accounts[NAME] = account;
  });

  _lodashFirecloud2.default.assign(accounts, accounts[env.AWS_ACCOUNT_ID]);

  return accounts;
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

//# sourceMappingURL=account.js.map