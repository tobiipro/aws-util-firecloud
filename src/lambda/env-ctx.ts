/* eslint-disable import/prefer-default-export */

import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  LambdaContext,
  LambdaEvent,
  PackageJson
} from '../types';

/*
  ctx = {
    functionName: undefined,
    functionVersion: undefined,
    invokedFunctionArn: undefined,
    memoryLimitInMB: undefined,
    awsRequestId: undefined,
    logGroupName: undefined,
    logStreamName: undefined,
    identity: {},
    // From X-Amz-Client-Context (HTTP Request Header)
    // For inspiration see
    // http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
    clientContext: {},
    // LAMBDA-HTTP CUSTOM
    // e.stageVariables + process.env
    env: {}
  }

  identity = {
    cognitoIdentityPoolId: undefined,
    accountId: undefined,
    cognitoIdentityId: undefined,
    caller: undefined,
    apiKey: undefined,
    sourceIp: undefined,
    cognitoAuthenticationType: undefined,
    cognitoAuthenticationProvider: undefined,
    userArn: undefined,
    userAgent: undefined,
    user: undefined
  }
*/

let _getResolver = function({
  ctx,
  tags = [
    'default'
  ]
}: {
  ctx: LambdaContext;
  tags: string[];
}): string {
  let {
    env
  } = ctx;

  return _.join([
    env.AWS_ACCOUNT_ID,
    env.AWS_LAMBDA_FUNCTION_ALIAS,
    env.AWS_LAMBDA_FUNCTION_NAME,
    env.AWS_REGION,
    env.ENV_NAME,
    ...tags
  ]);
};

let _get = (function() {
  let fn = async function({ctx, tags}: {
    ctx: LambdaContext;
    tags: string[];}
  ): Promise<LambdaContext> {
    let {
      env
    } = ctx;

    let s3 = new aws.S3({
      region: env.AWS_REGION,
      signatureVersion: 'v4'
    });

    let Body: aws.S3.GetObjectOutput['Body'];

    await ctx.log.trackTime('aws-util-firecloud.lambda._get: Fetching env ctx...', async function() {
      let result = await s3.getObject({
        Bucket: env.S3_CONFIG_BUCKET,
        Key: `${env.ENV_NAME}.json`
      }).promise();

      ({
        Body
      } = result);
    });
    Body = JSON.parse(Body.toString());

    let newCtx = {} as LambdaContext;
    _.forEach(tags, function(tag) {
      newCtx = _.merge(newCtx, _.defaultTo(Body[tag], {}));
    });

    return newCtx;
  };

  let memoizedFn = _.memoizeTtl(60 * 1000, fn, _getResolver);
  return memoizedFn;
})();

let _getAndRefresh = async function(...args: Parameters<typeof _getResolver>): Promise<LambdaContext> {
  let cacheKey = _getResolver(...args);
  if (_get.cache.has(cacheKey)) {
    let {
      value,
      expires
    } = _get.cache.get(cacheKey);

    if (expires <= Date.now()) {
      // schedule a refresh
      _.defer(_.asyncCb(async function() {
        await _get(...args);
      }));
    }

    return value;
  }

  return await _get(...args);
};

export let merge = async function({e, ctx, pkg}: {
  e: LambdaEvent & {
    stageVariables?: {
      [key: string]: string;
    };
  };
  ctx: LambdaContext;
  pkg: PackageJson;
}): Promise<void> {
  let AWS_ACCOUNT_ID =
      _.split(_.get(ctx, 'invokedFunctionArn', ''), ':')[4];
  AWS_ACCOUNT_ID =
    _.defaultTo(_.get(e, 'requestContext.accountId'), AWS_ACCOUNT_ID) as string;

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
