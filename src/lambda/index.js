import _ from 'lodash-firecloud';

import inspect from './inspect';

import {
  merge as mergeEnvCtx
} from './env-ctx';

import {
  setup as setupLogger
} from './logger';

let _cleanup = async function({ctx}) {
  if (global && global.gc) {
    await ctx.log.trackTime(
      'Garbage collection on demand...',
      async function() {
        global.gc();
      }
    );
  }
};

let _bootstrap = async function(fn, e, ctx, pkg) {
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
      ctx.log.trace(`Logger started with level=${ctx.log.level()}`, {
        e,
        ctx
      });
    }
  );

  await ctx.log.trackTime(
    'Inspecting...',
    async function() {
      await inspect({e, ctx});
    }
  );

  let result;
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
  _cleanup({ctx});

  return result;
};

export let getRequestInstance = function(req) {
  let {
    ctx
  } = req;
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};

export let bootstrap = function(fn, {
  pkg
}) {
  process.on('uncaughtException', function(err) {
    // eslint-disable-next-line no-console
    console.error('FATAL uncaughtException');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  process.on('unhandledRejection', function(err) {
    // eslint-disable-next-line no-console
    console.error('FATAL unhandledRejection');
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  return async function(e, ctx, awsNext) {
    try {
      let result = await _bootstrap(fn, e, ctx, pkg);
      return awsNext(undefined, result);
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
