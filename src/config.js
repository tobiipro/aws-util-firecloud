import logger from './logger';

export let getAwsConfig = function({env}) {
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger
  };
};
