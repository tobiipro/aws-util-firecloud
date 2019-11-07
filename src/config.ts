import env from './env';
import logger from './logger';

export let get = function({env}) {
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger
  };
};

export let current = get({env});

export default exports;
