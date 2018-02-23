'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AWS_ACCOUNT = exports.current = exports.get = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let get = exports.get = function ({ env }) {
  let awsAccountIdVars = _lodashFirecloud2.default.filter(_lodashFirecloud2.default.keys(env._), /_AWS_ACCOUNT_ID$/);
  let accounts = {};

  _lodashFirecloud2.default.forEach(awsAccountIdVars, function (awsAccountIdVar) {
    let prefix = _lodashFirecloud2.default.replace(awsAccountIdVar, /_AWS_ACCOUNT_ID$/, '');
    let NAME = _lodashFirecloud2.default.toLowerCase(prefix);
    let ID = env[awsAccountIdVar];

    let account = {
      NAME,
      ID,
      // using env._ because the vars are optional
      CI_USER: env._[`${prefix}_CI_USER`],
      NS: _lodashFirecloud2.default.split(_lodashFirecloud2.default.defaultsTo(env._[`${prefix}_NS`], ''), ',')
    };

    accounts[ID] = account;
    accounts[prefix] = account;
    accounts[NAME] = account;
  });

  _lodashFirecloud2.default.assign(accounts, accounts[env.AWS_ACCOUNT_ID]);

  return accounts;
};

let current = exports.current = exports.get({ env: _env2.default });

// backward compat alias
let AWS_ACCOUNT = exports.AWS_ACCOUNT = exports.current;

exports.default = current;

//# sourceMappingURL=account.js.map