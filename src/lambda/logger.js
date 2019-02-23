import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  MinLog,
  logToConsoleAwsLambda,
  serializeErr,
  serializeTime
} from 'minlog';

let _makeCtxSerializer = function({ctx}) {
  return async function({entry}) {
    entry.ctx = _.pick(ctx, [
      'awsRequestId'
    ]);

    return entry;
  };
};

let _awsLoggerRE =
  /^ *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(((?:.|\n)+)\)[^)]*$/;

let _setupAwsLogger = function({ctx}) {
  aws.config.logger = {
    isTTY: false,
    log: function(message) {
      if (!ctx.log._canTrace) {
        return;
      }

      let [
        serviceIdentifier,
        status,
        delta,
        retryCount,
        operation,
        params
      ] = _awsLoggerRE.exec(message).slice(1);

      try {
        let paramsWithoutArrayLength = _.replace(params, /,\s+\[length\]:\s+\d+(\s+\])/g, '$1');
        // eslint-disable-next-line no-eval
        params = eval(`(${paramsWithoutArrayLength})`);
      } catch (err) {
        ctx.log.error({
          err,
          message,
          params
        });
      }

      ctx.log.trace('Making an AWS SDK call.', {
        aws: {
          serviceIdentifier,
          status,
          delta,
          retryCount,
          operation,
          params
        }
      });
    }
  };
};

let _setupLongStacktraces = function({ctx}) {
  if (ctx.log._canTrace) {
    Error.stackTraceLimit = Infinity;

    if (_.isFunction(Promise.config)) {
      Promise.config({
        warnings: true,
        longStackTraces: true
      });
    }

    ctx.log.trace('Long stack traces enabled.');
  } else if (Error.stackTraceLimit === Infinity && /^prod/.test(process.env.NODE_ENV)) {
    ctx.log.error('Long stack traces cannot be disabled in this lambda instance!');
  }
};

export let setup = function({ctx}) {
  let level = _.get(ctx, 'env.LOG_LEVEL', 'info');

  let logger = new MinLog({
    serializers: [
      serializeTime,
      serializeErr,
      _makeCtxSerializer({ctx})
    ],
    listeners: [
      logToConsoleAwsLambda({
        level
      })
    ]
  });

  logger.level = function() {
    return level;
  };

  // internal convenience
  logger._canTrace = !logger.levelIsBeyondGroup('trace', level);

  ctx.log = logger;
  _setupAwsLogger({ctx});
  _setupLongStacktraces({ctx});
};

export default exports;
