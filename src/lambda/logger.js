import _ from 'lodash-firecloud';
import aws from 'aws-sdk';
import logger from '../logger';

import {
  MinLog,
  logToConsoleAwsLambda,
  serializeErr,
  serializeTime
} from 'minlog';

let _makeCtxSerializer = function({ctx}) {
  return async function({entry}) {
    // minimal ctx
    _.merge(entry, {
      ctx: {
        awsRequestId: ctx.awsRequestId
      }
    });

    return entry;
  };
};

let _awsLoggerRE =
  /^ *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(((?:.|\n)+)\)[^)]*$/;

let _setupAwsLogger = function({ctx}) {
  aws.config.logger = {
    isTTY: false,
    log: function(awsSdkMessage) {
      if (!ctx.log._canTrace) {
        return;
      }

      logger(awsSdkMessage, ctx.log);
    }
  };
};

let _setupLongStacktraces = function({ctx}) {
  if (!ctx.log._canTrace) {
    return;
  }
  Error.stackTraceLimit = Infinity;
  ctx.log.trace('Long stack traces enabled.');
};

export let setup = function({ctx}) {
  let level = _.get(ctx, 'env.LOG_LEVEL', 'info');

  let logger = new MinLog({
    serializers: [
      serializeTime(),
      serializeErr(),
      _makeCtxSerializer({ctx})
    ],
    listeners: [
      logToConsoleAwsLambda({
        level
      })
    ],
    requireRawEntry: true,
    requireSrc: true
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
