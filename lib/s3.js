'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDomain = exports.getBucketDomainName = exports.getLambdaBucketName = exports.getEnvBucketName = exports.getAccountBucketName = exports._getBucketName = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _account = require('./account');

var _account2 = _interopRequireDefault(_account);

var _region = require('./region');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let _getBucketName = exports._getBucketName = function ({
  prefix,
  region,
  env
}) {
  region = _lodashFirecloud2.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `${prefix}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  // as per http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  // the recommendation is NOT to use dots/uppercase
  name = _lodashFirecloud2.default.toLower(name);
  name = _lodashFirecloud2.default.replace(name, /[^a-z0-9-]/g, '-');
  name = _lodashFirecloud2.default.replace(name, /-+/g, '-');

  return name;
};

let getAccountBucketName = exports.getAccountBucketName = function ({
  prefix,
  region,
  env
}) {
  // there is one bucket per AWS account
  prefix = `${prefix}-${_account2.default.ID}`;
  return exports._getBucketName({ prefix, env, region });
};

let getEnvBucketName = exports.getEnvBucketName = exports._getBucketName;

let getLambdaBucketName = exports.getLambdaBucketName = function ({
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

let getBucketDomainName = exports.getBucketDomainName = function ({
  bucketName,
  region,
  env
}) {
  region = _lodashFirecloud2.default.defaultTo(region, (0, _region.get)({ env }));
  let domain = (0, _region.getDomain)({ region, env });

  return `${bucketName}.s3-website-${region}.${domain}`;
};

let getDomain = exports.getDomain = function ({
  region,
  env
}) {
  region = _lodashFirecloud2.default.defaultTo(region, (0, _region.get)({ env }));
  let service = `s3-${region}`;
  if (region === 'us-east-1') {
    service = 's3';
  }
  let domain = (0, _region.getDomain)({ region, env });
  return `${service}.${domain}`;
};

exports.default = exports;

//# sourceMappingURL=s3.js.map