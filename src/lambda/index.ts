import _ from 'lodash-firecloud';
// eslint-disable-next-line import/no-unresolved
import awsLambda from 'aws-lambda';
import inspect from './inspect';

import {
  LambdaContext,
  LambdaEvent,
  LambdaHandler,
  LambdaResult,
  PackageJson
} from '../types';

import {
  merge as mergeEnvCtx
} from './env-ctx';

import {
  setup as setupLogger
} from './logger';

import {
  MinLog
} from 'minlog';

let _logger = undefined as MinLog;

let _maybeFlushMinlog = async function(): Promise<void> {
  if (_.isUndefined(_logger)) {
    return;
  }
  let logger = _logger;
  _logger = undefined;
  try {
    await logger.flush();
  } catch (minlogFlushErr) {
    // eslint-disable-next-line no-console
    console.error('FATAL MinLog.flush');
    // eslint-disable-next-line no-console
    console.error(minlogFlushErr.stack);
  }
};

let _cleanup = async function({ctx}: {
  ctx: LambdaContext;
}): Promise<void> {
  if (_.isUndefined(global.gc)) {
    return;
  }
  await ctx.log.trackTime(
    'Garbage collection on demand...',
    async function() {
      global.gc();
    }
  );
};

// eslint-disable-next-line max-params
let _bootstrap = async function <
  TEvent extends LambdaEvent,
  TResult extends LambdaResult
>(
  fn: LambdaHandler<TEvent, TResult>,
  e: TEvent,
  ctx: LambdaContext,
  pkg: PackageJson
): Promise<TResult> {
  // temporary logger
  _logger = setupLogger({ctx});

  await ctx.log.trackTime(
    'Merging env ctx...',
    async function() {
      await mergeEnvCtx({e, ctx, pkg});
    }
  );

  await ctx.log.trackTime(
    'Setting up logger...',
    async function() {
      setupLogger({ctx});
      ctx.log.trace(`Logger started with level=${ctx.log.level()}`, {
        e,
        ctx
      });
    }
  );

  await ctx.log.trackTime(
    'Inspecting...',
    async function() {
      await inspect({ctx});
    }
  );

  let result: TResult;
  await ctx.log.trackTime(
    'Running fn...',
    async function() {
      result = await fn(e, ctx);
      ctx.log.trace('Fn result:', {
        result
      });
    }
  );

  // don't wait for cleanup on purpose
  _.defer(async function() {
    await _cleanup({ctx});
  });

  return result;
};

export let getRequestInstance = function({ctx}: {
  ctx: LambdaContext;
}): string {
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};

/* eslint-disable no-console */
export let bootstrap = function <
  TEvent extends LambdaEvent,
  TResult extends LambdaResult
>(fn: LambdaHandler<TEvent, TResult>, {
  pkg
}: {
  pkg: PackageJson;
}): awsLambda.Handler {
  process.on('uncaughtException', function(err: Error) {
    _maybeFlushMinlog().finally(function() {
      console.error('FATAL uncaughtException');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  });

  process.on('unhandledRejection', function(err: Error) {
    _maybeFlushMinlog().finally(function() {
      console.error('FATAL unhandledRejection');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  });

  return async function(e: TEvent, ctx: LambdaContext, awsNext: awsLambda.Callback) {
    let result: TResult;
    let err: Error;

    try {
      result = await _bootstrap<TEvent, TResult>(fn, e, ctx, pkg);
    } catch (err2) {
      err = err2;
    }

    if (_.isDefined(_logger)) {
      let logger = _logger;
      _logger = undefined;
      try {
        await logger.flush();
      } catch (minlogFlushErr) {
        console.error('FATAL MinLog.flush');
        console.error(minlogFlushErr.stack);
      }
    }

    if (_.isDefined(err)) {
      // proxying the err to awsNext would not reset state (kill lambda)
      // if (_.isFunction(awsNext)) {
      //   return awsNext(err);
      // } else {
      //   throw err;
      // }

      console.error('FATAL try-catch-lambda-bootstrap');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    if (_.isFunction(awsNext)) {
      awsNext(undefined, result);
    } else {
      return result;
    }
  };
  /* eslint-enable no-console */
};
