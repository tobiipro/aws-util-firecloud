import ResponseError from './res-error';
import _ from 'lodash-firecloud';
import express from 'express';
import pkg from '../../package.json';
import reqMixins from './req-mixins';
import resMixins from './res-mixins';

import {
  getRequestInstance
} from '../lambda';

import {
  ExpressLambdaRequest,
  ExpressLambdaResponse
} from '../types';

let _reqMixins = _.omit(reqMixins, 'default');
let _resMixins = _.omit(resMixins, 'default');

export let applyMixins = function() {
  return function(req: ExpressLambdaRequest, res: ExpressLambdaResponse, next: express.NextFunction) {
    _.forEach(_reqMixins, function(fn, name) {
      req[name] = _.bind(fn, req);
    });

    res.oldSend = res.send.bind(res); // required by the res.send mixin
    res.oldType = res.type.bind(res); // required by the res.type mixin
    _.forEach(_resMixins, function(fn, name) {
      res[name] = _.bind(fn, res);
    });

    next();
  };
};

export let xForward = function() {
  return function(req: ExpressLambdaRequest, _res: ExpressLambdaResponse, next: express.NextFunction) {
    req.headers = _.mapKeys(req.headers, function(_value, key) {
      return _.replace(key, /^X-Forward-/, '');
    });

    next();
  };
};

let _sendResponseError = function(res: ExpressLambdaResponse, err: ResponseError): void {
  let {
    code: status,
    contentType,
    body
  } = err;

  body.instance = getRequestInstance({ctx: res.ctx});

  res.status(status);
  res.type(contentType);
  res.send(body);
};

export let handleResponseError = function() {
  // function arity is important to distinguish to express that this is an error handler
  // eslint-disable-next-line max-params
  return async function(
    err: Error,
    _req: ExpressLambdaRequest,
    res: ExpressLambdaResponse,
    _next: express.NextFunction
  ) {
    let {
      ctx
    } = res;

    await ctx.log.error('Handling response error...', {
      err
    });

    if (res.headersSent) {
      await ctx.log.error("Headers already sent. Can't send error.");
      // bypass express' final-handler
      // return next(err);
      return res._next(err);
    }

    if (err instanceof ResponseError) {
      await ctx.log.error(`Responding with ${err.code} ${err.message}...`);
      _sendResponseError(res, err);
      return;
    }

    if (res.ctx.log._canTrace) {
      // preferrably we would like to respond with a stacktrace
      // and reset state (kill lambda), but it is impossible to do so:
      // AWS will freeze the lambda execution right after responding,
      // and kill the lambda on the subsequent request

      await ctx.log.info('Responding with trace...');
      let internalErr = new ResponseError(500, {
        renderer: pkg.name,
        trace: _.isDefined(err.stack) ? _.split(err.stack, '\n') : err
      });
      _sendResponseError(res, internalErr);
      return;
    }

    // let the lambda bootstrap handle this error e.g. process.exit(1)
    // and thus reset state (kill lambda)
    // and let API Gateway respond with 502 Bad Gateway.

    // NOTE: we cannot throw, because the error will be caught
    // by express' Layer.prototype.handle_error code

    res._next(err);
  };
};

export default exports;
