import ResponseError from './res-error';
import _ from 'lodash-firecloud';
import pkg from '../../package.json';
import reqMixins from './req-mixins';
import resMixins from './res-mixins';

let _reqMixins = _.omit(reqMixins, 'default');
let _resMixins = _.omit(resMixins, 'default');

export let applyMixins = function() {
  return function(req, res, next) {
    _.forEach(_reqMixins, function(fn, name) {
      req[name] = _.bind(fn, req);
    });

    res.oldSend = res.send; // required by the res.send mixin
    _.forEach(_resMixins, function(fn, name) {
      res[name] = _.bind(fn, res);
    });

    next();
  };
};

export let xForward = function() {
  return function(req, _res, next) {
    req.headers = _.mapKeys(req.headers, function(_value, key) {
      return _.replace(key, /^X-Forward-/, '');
    });

    next();
  };
};

export let resError = function() {
  return function(err, _req, res, _next) {
    let {
      ctx
    } = res;

    ctx.log.error({err});

    if (res.headersSent) {
      ctx.log.error("Headers already sent. Can't send error.");
      throw err;
    }

    if (!_.isFunction(res.sendError)) {
      throw err;
    }

    if (err instanceof ResponseError) {
      ctx.log.error(`Responding with ${err.code} ${err.message}...`);
      res.sendError(err);
    } else if (res.ctx.log._canTrace) {
      ctx.log.info('Responding with trace...');
      let internalErr = new ResponseError(500, {
        renderer: pkg.name,
        trace: err.stack ? _.split(err.stack, '\n') : err
      });
      res.sendError(internalErr);
    }
  };
};

export default exports;
