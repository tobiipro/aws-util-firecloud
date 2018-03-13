import _ from 'lodash-firecloud';

import {
  asyncHandler,
  getRequestInstance
} from './lambda';

export let bootstrap = function(fn) {
  return asyncHandler(async function(...args) {
    let res = args[1];
    let req = args[args.length - 3];

    try {
      await fn(...args);
    } catch (err) {
      res.log.error({err});
      if (res.headersSent) {
        return;
      }

      let trace;
      if (res.ctx.log.level() <= res.ctx.log.resolveLevel('TRACE')) {
        trace = err.stack ? _.split(err.stack, '\n') : err;
      }

      res.ctx.callbackWaitsForEmptyEventLoop = false;

      res.status(500);
      res.set('content-type', 'application/problem+json');
      res.send({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        instance: getRequestInstance(req),
        renderer: 'lambda-util',
        trace
      });

      // don't process.exit()
    }
  });
};

export default exports;
