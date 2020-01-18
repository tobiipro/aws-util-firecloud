import aws from 'aws-sdk';
import env from './env';
import logger from './logger';

import {
  Env
} from './types';

export let get = function({
  env
}: {
  env: Env;
}): Partial<aws.Config> {
  let region = env.AWS_REGION;

  // TODO should probably handle credentials, etc.
  return {
    region,
    logger: {
      log: function(...messages) {
        // ignore the rest, aws-sdk-js only calls with one argument: awsSdkMessage
        logger(messages[0]);
        if (messages.length > 1) {
          throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
        }
      }
    }
  };
};

export let current = get({env});
