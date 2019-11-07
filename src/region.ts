import _ from 'lodash-firecloud';
import env from './env';

export let chinaRegions = [
  'cn-north-1',
  'cn-northwest-1'
];

export let regions = [
  // Asia Pacific
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',

  // Canada
  'ca-central-1',

  // EU
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',

  // South America
  'sa-east-1',

  // US East
  'us-east-1',
  'us-east-2',

  // US West
  'us-west-1',
  'us-west-2'
];

export let get = function({env}) {
  return env.AWS_REGION;
};

export let getDomain = function({region, env}) {
  region = _.defaultTo(region, get({env}));
  let domain = 'amazonaws.com';

  if (_.has(chinaRegions, region)) {
    domain = 'amazonaws.com.cn';
  }

  return domain;
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
