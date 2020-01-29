"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getWebsiteDomain = exports.getDomain = exports.getBucketDomainName = exports.getEnvBucketName = exports.getAccountBucketName = exports.getProjectBucketName = exports._getBucketName = exports._hyphenRegions = void 0;var _account = _interopRequireDefault(require("./account"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));

var _region = require("./region");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}









// https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints
let _hyphenRegions = [
'us-east-1',
'us-west-1',
'us-west-2',
'ap-southeast-1',
'ap-southeast-2',
'ap-northeast-1',
'eu-west-1',
'sa-east-1'];exports._hyphenRegions = _hyphenRegions;


let _getBucketName = function ({
  prefix,
  env,
  region })




{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `${prefix}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  // as per http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  // the recommendation is NOT to use dots/uppercase
  name = _lodashFirecloud.default.toLower(name);
  name = _lodashFirecloud.default.replace(name, /[^a-z0-9-]/g, '-');
  name = _lodashFirecloud.default.replace(name, /-+/g, '-');

  return name;
};

// one per whole project (like builds- or infra-)
exports._getBucketName = _getBucketName;let getProjectBucketName = function ({
  prefix,
  env,
  region })




{
  return exports._getBucketName({ prefix, env, region });
};

// one per AWS account (like logs- or config-)
exports.getProjectBucketName = getProjectBucketName;let getAccountBucketName = function ({
  prefix,
  env,
  region })




{
  prefix = `${prefix}-${_account.default.ID}`;
  return exports._getBucketName({ prefix, env, region });
};

// one per ENV_NAME (like lambda buckets)
exports.getAccountBucketName = getAccountBucketName;let getEnvBucketName = function ({
  prefix,
  env,
  region })




{
  prefix = `${prefix}-${env.ENV_NAME}`;
  return exports._getBucketName({ prefix, env, region });
};exports.getEnvBucketName = getEnvBucketName;

let getBucketDomainName = function ({
  BucketName,
  env,
  region })




{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));
  let domain = exports.getWebsiteDomain({ region, env });

  return `${BucketName}.${domain}`;
};exports.getBucketDomainName = getBucketDomainName;

let getDomain = function ({
  env,
  region })



{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));
  let service = `s3-${region}`;
  if (region === 'us-east-1') {
    service = 's3';
  }
  let domain = (0, _region.getDomain)({ region, env });
  return `${service}.${domain}`;
};exports.getDomain = getDomain;

let getWebsiteDomain = function ({
  env,
  region })



{
  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));
  let domain = (0, _region.getDomain)({ region, env });

  let sep = '.';
  if (_lodashFirecloud.default.includes(exports._hyphenRegions, region)) {
    sep = '-';
  }

  return `s3-website${sep}${region}.${domain}`;
};exports.getWebsiteDomain = getWebsiteDomain;

//# sourceMappingURL=s3.js.map