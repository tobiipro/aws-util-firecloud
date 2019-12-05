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
let _bootstrap = async function<
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
export let bootstrap = function<
  TEvent extends LambdaEvent,
  TResult extends LambdaResult
>(fn: LambdaHandler<TEvent, TResult>, {
  pkg
}: {
  pkg: PackageJson;
}): awsLambda.Handler {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.on('uncaughtException', async function(err: Error) {
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

    console.error('FATAL uncaughtException');
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.on('unhandledRejection', async function(err: Error) {
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

    console.error('FATAL unhandledRejection');
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  return async function(e: TEvent, ctx: LambdaContext, awsNext: awsLambda.Callback) {
    try {
      let result = await _bootstrap<TEvent, TResult>(fn, e, ctx, pkg);
      awsNext(undefined, result);
    } catch (err) {
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

      // proxying the err to awsNext would not reset state (kill lambda)
      // return awsNext(err);

      console.error('FATAL try-catch-lambda-bootstrap');
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  };
  /* eslint-enable no-console */
};
