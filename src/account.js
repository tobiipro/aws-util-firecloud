import _ from 'lodash-firecloud';
import env from './env';

export let get = function({env}) {
  let account = {
    DEV: {
      CI_USER: process.env.DEV_CI_USER,
      ID: env.DEV_AWS_ACCOUNT_ID,
      NAME: 'dev',
      NS: _.split(env.DEV_NS, ',')
    },

    PROD: {
      CI_USER: process.env.PROD_CI_USER,
      ID: env.PROD_AWS_ACCOUNT_ID,
      NAME: 'prod',
      NS: _.split(env.PROD_NS, ',')
    }
  };

  account[env.DEV_AWS_ACCOUNT_ID] = account.DEV;
  account[env.PROD_AWS_ACCOUNT_ID] = account.PROD;

  _.assign(account, account[env.AWS_ACCOUNT_ID]);

  return account;
};

export let current = exports.get({env});

// backward compat alias
export let AWS_ACCOUNT = exports.current;

export default current;
