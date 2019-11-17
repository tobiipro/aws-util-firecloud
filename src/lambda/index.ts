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
  setupLogger({ctx});

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
      await ctx.log.trace(`Logger started with level=${ctx.log.level()}`, {
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
      await ctx.log.trace('Fn result:', {
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

export let bootstrap = function<
  TEvent extends LambdaEvent,
  TResult extends LambdaResult
>(fn: LambdaHandler<TEvent, TResult>, {
  pkg
}: {
  pkg: PackageJson;
}): awsLambda.Handler {
  process.on('uncaughtException', function(err) {
    // eslint-disable-next-line no-console
    console.error('FATAL uncaughtException');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  process.on('unhandledRejection', function(err: Error) {
    // eslint-disable-next-line no-console
    console.error('FATAL unhandledRejection');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  return async function(e: TEvent, ctx: LambdaContext, awsNext: awsLambda.Callback) {
    try {
      let result = await _bootstrap<TEvent, TResult>(fn, e, ctx, pkg);
      awsNext(undefined, result);
    } catch (err) {
      // proxying the err to awsNext would not reset state (kill lambda)
      // return awsNext(err);

      // eslint-disable-next-line no-console
      console.error('FATAL try-catch-lambda-bootstrap');
      // eslint-disable-next-line no-console
      console.error(err.stack);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  };
};

export default exports;
