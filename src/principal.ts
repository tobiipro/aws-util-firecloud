import _ from 'lodash-firecloud';

import {
  getDomain
} from './region';

import {
  Env,
  Principal
} from './types';

export let get = function({
  service,
  env,
  region
}: {
  service: string;
  env: Env;
  region?: string;
}): Principal {
  let domain = getDomain({env, region});

  return {
    Service: `${service}.${domain}`
  };
};

export default exports;
