/* eslint-disable no-invalid-this */
import Layer from 'express/lib/router/layer';
import _ from 'lodash-firecloud';
import _express from 'express';
import bearerToken from 'express-bearer-token';
import cors from 'cors';
import middlewares from './middlewares';
import responseTime from 'response-time';
import urlLib from 'url';

import {
  bootstrap as bootstrapLambda
} from '../lambda';

import {
  LambdaHttp
} from 'http-lambda';

let _bootstrapLayer = function() {
  let originalLayerHandleError = Layer.prototype.handle_error;
  Layer.prototype.handle_error = function(...args) {
    let fn = this.handle;

    if (fn.length === 4 && !this._callbackifiedHandle) {
      let callbackFn = _.callbackify(async function(err, req, res, next) {
        let safeFn = bootstrapResponseError(fn, res);
        return await safeFn(err, req, res, next);
      }, {
        keepCallback: true
      });
      // need to keep function arity
      this.handle = function(err, req, res, next) {
        return callbackFn(err, req, res, next);
      };
      this._callbackifiedHandle = true;
    }

    return originalLayerHandleError.call(this, ...args);
  };

  let originalLayerHandleRequest = Layer.prototype.handle_request;
  Layer.prototype.handle_request = function(...args) {
    let fn = this.handle; // (req, res, next)

    if (fn.length <= 3 && !this._callbackifiedHandle) {
      let callbackFn = _.callbackify(async function(req, res, next) {
        let safeFn = bootstrapResponseError(fn, res);
        return await safeFn(req, res, next);
      }, {
        keepCallback: true
      });
      // need to keep function arity
      this.handle = function(req, res, next) {
        return callbackFn(req, res, next);
      };
      this._callbackifiedHandle = true;
    }

    return originalLayerHandleRequest.call(this, ...args);
  };
};

export let express = function(e) {
  _bootstrapLayer();
  let app = _express();

  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.set('json spaces', 2);

  // FIXME hack!!!
  let host = _.get(e, 'headers.Host', _.get(e, 'headers.host'));
  if (_.startsWith(host, 'api-git.')) {
    // using the api-git apigateway-domainname (ci stack)
    let basePath = _.split(urlLib.parse(e.path).pathname, '/')[1];
    app.lazyrouter();
    app.use(`/${basePath}`, app._router);
  }

  app.use(responseTime());
  app.use(cors({
    exposedHeaders: [
      'location',
      'x-response-time'
    ],
    maxAge: 24 * 60 * 60 // 24 hours
  }));
  app.use(bearerToken());
  app.use(middlewares.applyMixins());
  app.use(middlewares.xForward());

  app.use(function(_req, res, next) {
    res.set('cache-control', 'max-age=0, no-store');
    next();
  });

  app.use(middlewares.resError());

  return app;
};

export let bootstrap = function(fn, {
  pkg
}) {
  return bootstrapLambda(async function(e, ctx) {
    let app;
    await ctx.log.trackTime(
      'aws-util-firecloud.express.bootstrap: Creating express app...',
      async function() {
        app = express(e);
      }
    );

    await ctx.log.trackTime(
      'aws-util-firecloud.express.bootstrap: Setting up custom express...',
      async function() {
        fn = bootstrapResponseError(fn, app.res);
        await fn(app, e, ctx);
      }
    );

    let result;
    ctx.log.info('aws-util-firecloud.express.bootstrap: Creating HTTP server (handling request)...');
    await ctx.log.trackTime(
      'aws-util-firecloud.express.bootstrap: Creating HTTP server (handling request)...',
      _.promisify(function(done) {
        let http = new LambdaHttp(e, ctx, function(err, resData) {
          result = resData;
          done(err);
        });
        http.createServer(app);
      })
    );

    return result;
  }, {
    pkg
  });
};

export default exports;
