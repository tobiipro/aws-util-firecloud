import _ from 'lodash-firecloud';
import http from 'http';
import pkg from '../../package.json';

export let ResponseError = function(status, extensions = {}) {
  this.code = status;
  this.message = http.STATUS_CODES[status];

  this.contentType = 'application/problem+json';
  let body = _.merge({
    type: 'about:blank',
    title: this.message,
    status: this.code
  }, extensions);
  this.body = body;
};
ResponseError.prototype = new Error();

export let bootstrap = function(fn, res) {
  return async function(...args) {
    try {
      return await _.alwaysPromise(fn(...args));
    } catch (err) {
      let {
        ctx
      } = res;

      ctx.log.error({err});

      if (res.headersSent) {
        ctx.log.error("Headers already sent. Can't send error.");
      }

      if (err instanceof ResponseError) {
        ctx.log.error(`Responding with ${err.code} ${err.message}...`);
        res.sendError(err);
      }

      if (res.ctx.log._canTrace) {
        ctx.log.info('Responding with trace...');
        let internalErr = new ResponseError(500, {
          renderer: pkg.name,
          trace: err.stack ? _.split(err.stack, '\n') : err
        });
        res.sendError(internalErr);
      }

      throw err;
    }
  };
};

export default ResponseError;
