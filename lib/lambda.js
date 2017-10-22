'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRequestInstance = exports.setupLogging = exports._getEnvCtx = exports.getEnvCtx = exports.getEnvCtxResolver = exports.mergeEnvCtx = exports.bootstrap = exports.inspect = exports.asyncHandler = exports.awsLoggerRE = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _bunyanSlack = require('bunyan-slack');

var _bunyanSlack2 = _interopRequireDefault(_bunyanSlack);

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _formatRecord = require('bunyan-format/lib/format-record');

var _formatRecord2 = _interopRequireDefault(_formatRecord);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
let awsLoggerRE = exports.awsLoggerRE = / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

let asyncHandler = exports.asyncHandler = function (fn) {
  return function (...args) {
    let next = args[args.length - 1];
    fn(...args).catch(next);
  };
};

let inspect = exports.inspect = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({ _e, ctx }) {
    if (ctx.log.level() > ctx.log.resolveLevel('TRACE')) {
      return;
    }

    // Added in: v6.1.0
    // let cpuUsage = process.cpuUsage(exports.inspect.previousCpuUsage);
    // exports.inspect.previousCpuUsage = cpuUsage;

    let inspection = {
      process: _lodashFirecloud2.default.merge(_lodashFirecloud2.default.pick(process, ['arch', 'argv', 'argv0', 'config', 'env', 'execArgv', 'pid', 'platform', 'release', 'title', 'version', 'versions']), {
        // cpuUsage,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }),
      os: _lodashFirecloud2.default.mapValues(_os2.default, function (fn) {
        if (!_lodashFirecloud2.default.isFunction(fn)) {
          return;
        }

        return fn();
      })
    };

    let { previousMemoryUsage } = exports.inspect;
    if (previousMemoryUsage) {
      inspection.process.memoryUsageDiff = {
        rss: previousMemoryUsage.rss - inspection.process.memoryUsage.rss,
        heapUsed: previousMemoryUsage.heapUsed - inspection.process.memoryUsage.heapUsed,
        time: previousMemoryUsage.uptime - inspection.process.uptime
      };
      exports.inspect.previousMemoryUsage = {
        rss: inspect.process.memoryUsage.rss,
        heapUsed: inspect.process.memoryUsage.heapUsed,
        uptime: inspect.process.uptime
      };
    }

    ctx.log.trace(inspection, 'Inspection');
  });

  return function inspect(_x) {
    return _ref.apply(this, arguments);
  };
})();

// using console.log instead of the logger on purpose
let bootstrap = exports.bootstrap = function (fn, { pkg }) {
  return exports.asyncHandler((() => {
    var _ref2 = (0, _bluebird.coroutine)(function* (e, ctx, next) {
      yield _lodashFirecloud2.default.consoleLogTime('aws-util-firecloud.lambda.bootstrap: Merging env ctx...', (0, _bluebird.coroutine)(function* () {
        yield exports.mergeEnvCtx({ e, ctx, pkg });
      }));

      yield _lodashFirecloud2.default.consoleLogTime('aws-util-firecloud.lambda.bootstrap: Setting up logger...', (0, _bluebird.coroutine)(function* () {
        exports.setupLogging({ e, ctx });
      }));

      yield _lodashFirecloud2.default.consoleLogTime('aws-util-firecloud.lambda.bootstrap: Inspecting...', (0, _bluebird.coroutine)(function* () {
        yield exports.inspect({ e, ctx });
      }));

      yield _lodashFirecloud2.default.consoleLogTime('aws-util-firecloud.lambda.bootstrap: Running fn...', (0, _bluebird.coroutine)(function* () {
        yield fn(e, ctx, next);
      }));

      if (global && global.gc) {
        yield _lodashFirecloud2.default.consoleLogTime('aws-util-firecloud.lambda.bootstrap: Garbage collection on demand...', (0, _bluebird.coroutine)(function* () {
          global.gc();
        }));
      }
    });

    return function (_x2, _x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  })());
};

let mergeEnvCtx = exports.mergeEnvCtx = (() => {
  var _ref8 = (0, _bluebird.coroutine)(function* ({ e, ctx, pkg }) {
    console.log('mergeEnvCtx: Get env from event and context...');

    let AWS_ACCOUNT_ID = _lodashFirecloud2.default.split(_lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', ''), ':')[4];
    AWS_ACCOUNT_ID = _lodashFirecloud2.default.defaultTo(_lodashFirecloud2.default.get(e, 'requestContext.accountId'), AWS_ACCOUNT_ID);

    let AWS_REGION = _lodashFirecloud2.default.split(_lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', ''), ':')[3];

    let pkgNameRE = _lodashFirecloud2.default.replace(pkg.name, /([.-])/, '\\$1');
    let ENV_NAME = _lodashFirecloud2.default.split(_lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', ''), ':')[6];
    ENV_NAME = _lodashFirecloud2.default.replace(ENV_NAME, new RegExp(`\\-${pkgNameRE}$`), '');

    let AWS_LAMBDA_FUNCTION_NAME = _lodashFirecloud2.default.split(_lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', ''), ':')[6];

    let AWS_LAMBDA_FUNCTION_ALIAS = _lodashFirecloud2.default.split(_lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', ''), ':')[7];
    AWS_LAMBDA_FUNCTION_ALIAS = _lodashFirecloud2.default.defaultTo(AWS_LAMBDA_FUNCTION_ALIAS, '$LATEST');

    _lodashFirecloud2.default.defaultsDeep(ctx, {
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

    console.log('mergeEnvCtx: Get env ctx from config bucket...');

    let envCtx = yield exports.getEnvCtx({
      ctx,
      tags: ['lambdas', `lambdas/${pkg.name}`]
    });
    _lodashFirecloud2.default.defaultsDeep(ctx, envCtx);
  });

  return function mergeEnvCtx(_x5) {
    return _ref8.apply(this, arguments);
  };
})();

let getEnvCtxResolver = exports.getEnvCtxResolver = function ({ ctx, tags = ['default'] }) {
  let { env } = ctx;

  return [env.AWS_ACCOUNT_ID, env.AWS_LAMBDA_FUNCTION_ALIAS, env.AWS_LAMBDA_FUNCTION_NAME, env.AWS_REGION, env.ENV_NAME].concat(tags).join();
};

let getEnvCtx = exports.getEnvCtx = (() => {
  var _ref9 = (0, _bluebird.coroutine)(function* ({ ctx, tags = ['default'] }) {
    // eslint-disable-line no-unused-vars
    // eslint-disable-next-line fp/no-arguments
    let cacheKey = exports.getEnvCtxResolver(...arguments);
    let cachedResult = exports._getEnvCtx.cache[cacheKey];
    cachedResult = _lodashFirecloud2.default.defaultTo(cachedResult, exports._getEnvCtx.oldCache[cacheKey]);
    cachedResult = _lodashFirecloud2.default.defaultTo(cachedResult, {});
    let aMinuteAgo = Date.now() - 60 * 1000;

    if (!cachedResult.ctx) {
      console.log('getEnvCtx: Waiting for new env ctx...');
      // eslint-disable-next-line fp/no-arguments
      cachedResult = yield exports._getEnvCtx(...arguments);
    }

    if (cachedResult.lastFetched < aMinuteAgo) {
      console.log('getEnvCtx: Refreshing env ctx for next call...');
      exports._getEnvCtx.oldCache.set(cacheKey, exports._getEnvCtx.cache[cacheKey]);
      exports._getEnvCtx.cache.delete(cacheKey);
      // eslint-disable-next-line fp/no-arguments
      exports._getEnvCtx(...arguments);
    }

    console.log('getEnvCtx: Return env ctx...');
    return cachedResult.ctx;
  });

  return function getEnvCtx(_x6) {
    return _ref9.apply(this, arguments);
  };
})();

let _getEnvCtx = exports._getEnvCtx = _lodashFirecloud2.default.memoize((() => {
  var _ref10 = (0, _bluebird.coroutine)(function* ({ ctx: { env }, tags }) {
    // eslint-disable-next-line fp/no-arguments
    let cacheKey = exports.getEnvCtxResolver(...arguments);
    let s3 = new _awsSdk2.default.S3({
      region: env.AWS_REGION,
      signatureVersion: 'v4'
    });

    let Body;
    let ETag;

    yield _lodashFirecloud2.default.consoleLogTime('_getEnvCtx: Fetching env ctx...', (0, _bluebird.coroutine)(function* () {
      let result = yield s3.getObject({
        Bucket: `config-${env.AWS_ACCOUNT_ID}-tobiicloud-com-${env.AWS_REGION}`,
        Key: `${env.ENV_NAME}.json`,
        IfMatch: _lodashFirecloud2.default.defaultTo(exports._getEnvCtx.oldCache[cacheKey], {}).etag
      }).promise();

      ({
        Body,
        ETag
      } = result);
    }));
    Body = JSON.parse(Body.toString());

    let ctx = {};

    console.log('_getEnvCtx: Merging env ctx...');
    _lodashFirecloud2.default.forEach(tags, function (tag) {
      ctx = _lodashFirecloud2.default.merge(ctx, _lodashFirecloud2.default.defaultTo(Body[tag], {}));
    });

    return {
      ctx,
      etag: ETag,
      lastFetched: Date.now()
    };
  });

  return function (_x7) {
    return _ref10.apply(this, arguments);
  };
})(), exports.getEnvCtxResolver);
_getEnvCtx.oldCache = new _lodashFirecloud2.default.memoize.Cache();

let setupLogging = exports.setupLogging = function ({ e, ctx }) {
  let streams = [{
    stream: process.stdout
  }];

  let [, slackUser] = ctx.env.ENV_NAME.match(/^git-(keep-)?([a-z]{3})(?:-.+)?$/) || [];

  if (ctx.env.SLACK_WEBHOOK && slackUser) {
    streams.push({
      level: 'DEBUG',
      stream: new _bunyanSlack2.default({
        webhook_url: ctx.env.SLACK_WEBHOOK,
        channel: `@${slackUser}`, // to
        customFormatter: function (record, _levelName) {
          let invokedFunctionArn = _lodashFirecloud2.default.get(ctx, 'invokedFunctionArn', '');
          let log = (0, _formatRecord2.default)(record, {
            outputMode: 'long',
            color: false
          });

          return {
            text: ['', `*${ctx.env.ENV_NAME}*`, `*${invokedFunctionArn}*`, log].join('\n')
          };
        }
      })
    });
  }

  let logger = _bunyan2.default.createLogger({
    name: ctx.functionName,
    level: _lodashFirecloud2.default.get(ctx, 'env.LOG_LEVEL', 'INFO'),
    serializers: _bunyan2.default.stdSerializers,
    src: true,
    req_id: ctx.awsRequestId,
    streams
  });
  logger.resolveLevel = _bunyan2.default.resolveLevel;

  logger.trace({ e, ctx }, `Logger started. ${logger.level()}`);

  ctx.log = logger;

  if (ctx.log.level() <= ctx.log.resolveLevel('TRACE')) {
    Error.stackTraceLimit = Infinity;
    if (Promise.config) {
      Promise.config({
        warnings: true,
        longStackTraces: true
      });
    }
    ctx.log.trace('Long stack traces enabled');
  } else if (Error.stackTraceLimit === Infinity && /^prod/.test(process.env.NODE_ENV)) {
    ctx.log.error('Long stack traces cannot be disabled. New deployment is required!');
  }

  _awsSdk2.default.config.logger = {
    isTTY: false,
    log: function (message) {
      if (ctx.log.level() > ctx.log.resolveLevel('TRACE')) {
        return;
      }

      let [serviceIdentifier, status, delta, retryCount, operation, params] = exports.awsLoggerRE.exec(message).slice(1);
      params = eval(`(${params})`); // eslint-disable-line no-eval

      ctx.log.trace({
        aws: {
          serviceIdentifier,
          status,
          delta,
          retryCount,
          operation,
          params
        }
      }, 'Making an AWS SDK call.');
    }
  };
};

let getRequestInstance = exports.getRequestInstance = function (req) {
  let { ctx } = req;
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};

exports.default = bootstrap;

//# sourceMappingURL=lambda.js.map