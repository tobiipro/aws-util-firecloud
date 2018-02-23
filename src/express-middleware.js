import _ from 'lodash-firecloud';

import {
  asyncHandler,
  getRequestInstance
} from './lambda';

// export let accepts = function(types) {
//   return exports.bootstrap(async function(req, res) {
//     res.mediaType = req.accepts(types);
//     if (!res.mediaType) {
//       return res.sendError(406);
//     }
//   });
// };

// export let is = function(types) {
//   return exports.bootstrap(async function(req, res) {
//     req.mediaType = req.is(types);
//     if (!req.mediaType) {
//       return res.sendError(415);
//     }
//   });
// };

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
