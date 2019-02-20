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
      'aws-util-firecloud.lambda.bootstrap: Garbage collection on demand...',
      async function() {
        global.gc();
      }
    );
  }
};

let _bootstrap = async function({fn, e, ctx, pkg}) {
  // temporary logger
  setupLogger({ctx});

  await ctx.log.trackTime(
    'aws-util-firecloud.lambda.bootstrap: Merging env ctx...',
    async function() {
      await mergeEnvCtx({e, ctx, pkg});
    }
  );

  await ctx.log.trackTime(
    'aws-util-firecloud.lambda.bootstrap: Setting up logger...',
    async function() {
      setupLogger({ctx});
      ctx.log.trace(`Logger started. ${ctx.log.level()}`, {
        e,
        ctx
      });
    }
  );

  await ctx.log.trackTime(
    'aws-util-firecloud.lambda.bootstrap: Inspecting...',
    async function() {
      await inspect({e, ctx});
    }
  );

  let result;
  await ctx.log.trackTime(
    'aws-util-firecloud.lambda.bootstrap: Running fn...',
    async function() {
      result = await fn(e, ctx);
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
  return _.callbackify(async function(e, ctx) {
    return await _bootstrap({fn, e, ctx, pkg});
  });
};

export default exports;
