import _ from 'lodash-firecloud';
import env from './env';

export let get = function({env}) {
  let awsAccountIdVars = _.filter(_.keys(env._), /_AWS_ACCOUNT_ID$/);
  let accounts = {};

  _.forEach(awsAccountIdVars, function(awsAccountIdVar) {
    let prefix = _.replace(awsAccountIdVar, /_AWS_ACCOUNT_ID$/, '');
    let NAME = _.toLower(prefix);
    let ID = env[awsAccountIdVar];

    let account = {
      NAME,
      ID,
      // using env._ because the vars are optional
      CI_USER: env._[`${prefix}_CI_USER`],
      NS: _.split(_.defaultTo(env._[`${prefix}_NS`], ''), ',')
    };

    accounts[ID] = account;
    accounts[prefix] = account;
    accounts[NAME] = account;
  });

  _.assign(accounts, accounts[env.AWS_ACCOUNT_ID]);

  return accounts;
};

export let current = exports.get({env});

// backward compat alias
export let AWS_ACCOUNT = exports.current;

export default current;
