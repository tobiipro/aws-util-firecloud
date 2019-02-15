import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

let _memoizeResolver = function({
  ctx,
  tags = [
    'default'
  ]
}) {
  let {
    env
  } = ctx;

  return [
    env.AWS_ACCOUNT_ID,
    env.AWS_LAMBDA_FUNCTION_ALIAS,
    env.AWS_LAMBDA_FUNCTION_NAME,
    env.AWS_REGION,
    env.ENV_NAME
  ].concat(tags).join();
};

let _get = async function({ctx, tags}) {
  let {
    env
  } = ctx;
  // eslint-disable-next-line fp/no-arguments
  let cacheKey = _memoizeResolver(...arguments);
  let s3 = new aws.S3({
    region: env.AWS_REGION,
    signatureVersion: 'v4'
  });

  let Body;
  let ETag;

  await ctx.log.trackTime('aws-util-firecloud.lambda._get: Fetching env ctx...', async function() {
    let result = await s3.getObject({
      Bucket: env.S3_CONFIG_BUCKET,
      Key: `${env.ENV_NAME}.json`,
      IfMatch: (_.defaultTo(_get.oldCache[cacheKey], {})).etag
    }).promise();

    ({
      Body,
      ETag
    } = result);
  });
  Body = JSON.parse(Body.toString());

  let newCtx = {};
  _.forEach(tags, function(tag) {
    newCtx = _.merge(newCtx, _.defaultTo(Body[tag], {}));
  });

  return {
    ctx: newCtx,
    etag: ETag,
    lastFetched: Date.now()
  };
};
_get = _.memoize(_get, _memoizeResolver);
_get.oldCache = new _.memoize.Cache();

let _getAndRefresh = async function(...args) {
  let cacheKey = _memoizeResolver(...args);
  let cachedResult = _get.cache[cacheKey];
  cachedResult = _.defaultTo(cachedResult, _get.oldCache[cacheKey]);
  cachedResult = _.defaultTo(cachedResult, {});
  let aMinuteAgo = Date.now() - 60 * 1000;

  if (!cachedResult.ctx) {
    cachedResult = await _get(...args);
  }

  if (cachedResult.lastFetched < aMinuteAgo) {
    _get.oldCache.set(cacheKey, _get.cache[cacheKey]);
    _get.cache.delete(cacheKey);
    // don't await, we refresh the ctx for next call
    // await _get(...args);
    _get(...args);
  }

  return cachedResult.ctx;
};

export let merge = async function({e, ctx, pkg}) {
  let AWS_ACCOUNT_ID =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[4];
  AWS_ACCOUNT_ID =
    _.defaultTo(_.get(e, 'requestContext.accountId'), AWS_ACCOUNT_ID);

  let AWS_REGION =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[3];

  let pkgNameRE = _.replace(pkg.name, /([.-])/, '\\$1');
  let ENV_NAME =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[6];
  ENV_NAME = _.replace(ENV_NAME, new RegExp(`\\-${pkgNameRE}$`), '');

  let AWS_LAMBDA_FUNCTION_NAME =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[6];

  let AWS_LAMBDA_FUNCTION_ALIAS =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[7];
  AWS_LAMBDA_FUNCTION_ALIAS = _.defaultTo(AWS_LAMBDA_FUNCTION_ALIAS, '$LATEST');

  _.defaultsDeep(ctx, {
    env: e.stageVariables
  }, {
    env: {
      AWS_ACCOUNT_ID,
      AWS_LAMBDA_FUNCTION_ALIAS,
      AWS_LAMBDA_FUNCTION_NAME,
      AWS_REGION,
      ENV_NAME
    }
  }, {
    env: e.stageVariables
  }, {
    env: {
      // AWS does not allow empty-string stage variables...
      API_BASE_PATH: '',
      API_SECONDARY_BASE_PATH: ''
    }
  }, {
    env: process.env
  });

  let envCtx = await _getAndRefresh({
    ctx,
    tags: [
      'lambdas',
      `lambdas/${pkg.name}`
    ]
  });
  _.defaultsDeep(ctx, envCtx);
};

export default exports;
