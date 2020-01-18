import AWS_ACCOUNT from './account';
import _ from 'lodash-firecloud';

import {
  get as getRegion,
  getDomain as getRegionDomain
} from './region';

import {
  Env,
  Region
} from './types';

// https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints
let _hyphenRegions = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'eu-west-1',
  'sa-east-1'
];

let _getBucketName = function({
  prefix,
  env,
  region
}: {
  prefix: string;
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));

  let name = `${prefix}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  // as per http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  // the recommendation is NOT to use dots/uppercase
  name = _.toLower(name);
  name = _.replace(name, /[^a-z0-9-]/g, '-');
  name = _.replace(name, /-+/g, '-');

  return name;
};

// one per whole project (like builds- or infra-)
export let getProjectBucketName = function({
  prefix,
  env,
  region
}: {
  prefix: string;
  env: Env;
  region?: Region;
}): string {
  return _getBucketName({prefix, env, region});
};

// one per AWS account (like logs- or config-)
export let getAccountBucketName = function({
  prefix,
  env,
  region
}: {
  prefix: string;
  env: Env;
  region?: Region;
}): string {
  prefix = `${prefix}-${AWS_ACCOUNT.ID}`;
  return _getBucketName({prefix, env, region});
};

// one per ENV_NAME (like lambda buckets)
export let getEnvBucketName = function({
  prefix,
  env,
  region
}: {
  prefix: string;
  env: Env;
  region?: Region;
}): string {
  prefix = `${prefix}-${env.ENV_NAME}`;
  return _getBucketName({prefix, env, region});
};

export let getBucketDomainName = function({
  BucketName,
  env,
  region
}: {
  BucketName: string;
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));
  let domain = getWebsiteDomain({region, env});

  return `${BucketName}.${domain}`;
};

export let getDomain = function({
  env,
  region
}: {
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));
  let service = `s3-${region}`;
  if (region === 'us-east-1') {
    service = 's3';
  }
  let domain = getRegionDomain({region, env});
  return `${service}.${domain}`;
};

export let getWebsiteDomain = function({
  env,
  region
}: {
  env: Env;
  region?: Region;
}): string {
  region = _.defaultTo(region, getRegion({env}));
  let domain = getRegionDomain({region, env});

  let sep = '.';
  if (_.includes(_hyphenRegions, region)) {
    sep = '-';
  }

  return `s3-website${sep}${region}.${domain}`;
};
