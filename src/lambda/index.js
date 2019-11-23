import _ from 'lodash-firecloud';

import inspect from './inspect';

import {
  merge as mergeEnvCtx
} from './env-ctx';

import {
  setup as setupLogger
} from './logger';

let _logger;

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
      _logger = setupLogger({ctx});
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
      ctx.log.trace('Fn result:', {
        result
      });
    }
  );

  // don't wait for cleanup on purpose
  _cleanup({ctx});

  return result;
};

export let getRequestInstance = function({ctx}) {
  return `${ctx.invokedFunctionArn}#request:${ctx.awsRequestId}`;
};

/* eslint-disable no-console */
export let bootstrap = function(fn, {
  pkg
}) {
  process.on('uncaughtException', async function(err) {
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

  process.on('unhandledRejection', async function(err) {
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

  return async function(e, ctx, awsNext) {
    try {
      let result = await _bootstrap(fn, e, ctx, pkg);
      return awsNext(undefined, result);
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

export default exports;
