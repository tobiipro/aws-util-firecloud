import _ from 'lodash-firecloud';

import {
  getDomain
} from './region';

export let get = function({
  env,
  region,
  service
}) {
  let domain = getDomain({env, region});

  return {
    Service: `${service}.${domain}`
  };
};

export default exports;
