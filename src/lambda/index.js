import _ from 'lodash-firecloud';

import inspect from './inspect';

import {
  merge as mergeEnvCtx
} from './env-ctx';

import {
  setup as setupLogger
} from './logger';

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

    await ctx.log.trackTime(
      'aws-util-firecloud.lambda.bootstrap: Running fn...',
      async function() {
        await fn(e, ctx);
      }
    );

    if (global && global.gc) {
      await ctx.log.trackTime(
        'aws-util-firecloud.lambda.bootstrap: Garbage collection on demand...',
        async function() {
          global.gc();
        }
      );
    }

    ctx.log.debug('Execution time report:');
    _.forEach(ctx.log.trackTime.reports, function(report) {
      ctx.log.debug(report);
    });
  });
};

export default exports;