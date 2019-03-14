import _ from 'lodash-firecloud';
import env from './env';

export let get = function({env}) {
  let awsAccountIdVars = _.filter(_.keys(env), function(varName) {
    return /_AWS_ACCOUNT_ID$/.test(varName);
  });
  let accounts = {};

  _.forEach(awsAccountIdVars, function(awsAccountIdVar) {
    let prefix = _.replace(awsAccountIdVar, /_AWS_ACCOUNT_ID$/, '');
    let NAME = _.toLower(prefix);
    let ID = env[awsAccountIdVar];

    let account = {
      NAME,
      ID
    };

    let prefixedEnvVars = _.pickBy(env, function(_value, key) {
      return _.startsWith(key, `${prefix}_`);
    });
    prefixedEnvVars = _.mapKeys(prefixedEnvVars, function(_value, key) {
      return _.replace(key, new RegExp(`^${prefix}_`), '');
    });
    _.merge(account, prefixedEnvVars);

    account.NS = _.split(_.defaultTo(account.NS, ''), ',');

    accounts[ID] = account;
    accounts[prefix] = account;
    accounts[NAME] = account;
  });

  _.assign(accounts, accounts[env.AWS_ACCOUNT_ID]);

  return accounts;
};

export let current;

// lazy init
// eslint-disable-next-line fp/no-proxy
export let currentProxy = new Proxy({}, {
  get: function(_target, property, _receiver) {
    if (!current) {
      current = get({env});
    }

    return current[property];
  }
});

export default currentProxy;
