import AWS_ACCOUNT from './account';
import _ from 'lodash-firecloud';

import {
  get as getRegion,
  getDomain as getRegionDomain
} from './region';

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
  region,
  env
}) {
  region = _.defaultTo(region, getRegion({env}));

  let name = `${prefix}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  // as per http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  // the recommendation is NOT to use dots/uppercase
  name = _.toLower(name);
  name = _.replace(name, /[^a-z0-9-]/g, '-');
  name = _.replace(name, /-+/g, '-');

  return name;
};

export let getAccountBucketName = function({
  prefix,
  region,
  env
}) {
  // there is one bucket per AWS account
  prefix = `${prefix}-${AWS_ACCOUNT.ID}`;
  return _getBucketName({prefix, env, region});
};

export let getEnvBucketName = _getBucketName;

export let getLambdaBucketName = function({
  pkg,
  env,
  region
}) {
  let name = getEnvBucketName({
    prefix: `${pkg.name}-${env.ENV_NAME}`,
    region,
    env
  });

  return name;
};

export let getBucketDomainName = function({
  BucketName = bucketName, // eslint-disable-line no-use-before-define
  region,
  env,
  bucketName // FIXME deprecated
}) {
  region = _.defaultTo(region, getRegion({env}));
  let domain = getWebsiteDomain({region, env});

  return `${BucketName}.${domain}`;
};

export let getDomain = function({
  region,
  env
}) {
  region = _.defaultTo(region, getRegion({env}));
  let service = `s3-${region}`;
  if (region === 'us-east-1') {
    service = 's3';
  }
  let domain = getRegionDomain({region, env});
  return `${service}.${domain}`;
};

export let getWebsiteDomain = function({
  region,
  env
}) {
  region = _.defaultTo(region, getRegion({env}));
  let domain = getRegionDomain({region, env});

  let sep = '.';
  if (_.includes(_hyphenRegions, region)) {
    sep = '-';
  }

  return `s3-website${sep}${region}.${domain}`;
};

export default exports;
