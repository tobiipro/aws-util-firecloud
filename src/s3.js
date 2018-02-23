import _ from 'lodash-firecloud';
import AWS_ACCOUNT from './account';

import {
  get as getRegion,
  getDomain as getRegionDomain
} from './region';

export let _getBucketName = function({
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
  return exports._getBucketName({prefix, env, region});
};

export let getEnvBucketName = exports._getBucketName;

export let getLambdaBucketName = function({
  pkg,
  env,
  region
}) {
  let name = exports.getEnvBucketName({
    prefix: `${pkg.name}-${env.ENV_NAME}`,
    region,
    env
  });

  return name;
};

export let getBucketDomainName = function({
  bucketName,
  region,
  env
}) {
  region = _.defaultTo(region, getRegion({env}));
  let domain = getRegionDomain({region, env});

  return `${bucketName}.s3-website-${region}.${domain}`;
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

export default exports;
