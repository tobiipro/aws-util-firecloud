import _ from 'lodash-firecloud';
import aws from 'aws-sdk';
import logger from '../logger';

import {
  LambdaContext
} from '../types';

import {
  MinLog,
  logToConsoleAwsLambda,
  serializeErr,
  serializeTime
} from 'minlog';

// TODO missing definition in aws-sdk-js
declare module 'aws-sdk/lib/config' {
  interface Logger {
    isTTY?: boolean;
  }
}

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

let _setupAwsLogger = function({ctx}: {
  ctx: LambdaContext;
}): void {
  aws.config.logger = {
    isTTY: false,
    log: function(...messages) {
      if (!ctx.log._canTrace) {
        return;
      }

      logger(messages[0], ctx.log);
      if (messages.length > 1) {
        throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
      }
    }
  };
};

let _setupLongStacktraces = function({ctx}: {
  ctx: LambdaContext;
}): void {
  if (!ctx.log._canTrace) {
    return;
  }
  Error.stackTraceLimit = Infinity;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  ctx.log.trace('Long stack traces enabled.');
};

export let setup = function({ctx}: {
  ctx: LambdaContext;
}): void {
  let level = _.get(ctx, 'env.LOG_LEVEL', 'info');

  let _logger = new MinLog({
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

  let logger = _.assign(_logger, {
    level: function() {
      return level;
    },

    // internal convenience
    _canTrace: !_logger.levelIsBeyondGroup('trace', level)
  });

  ctx.log = logger;
  _setupAwsLogger({ctx});
  _setupLongStacktraces({ctx});
};

export default exports;
