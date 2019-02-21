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
  Layer.prototype.handle_error = function(error, req, res, next) {
    let fn = this.handle;

    if (fn.length !== 4) {
      // not a standard error handler
      return next(error);
    }

    try {
      _.alwaysPromise(fn(error, req, res, next)).catch(next);
    } catch (err) {
      return next(err);
    }
  };

  Layer.prototype.handle_request = function(req, res, next) {
    let fn = this.handle;

    if (fn.length > 3) {
      // not a standard request handler
      return next();
    }

    try {
      _.alwaysPromise(fn(req, res, next)).catch(next);
    } catch (err) {
      return next(err);
    }
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
        await fn(app, e, ctx);
      }
    );

    let result;
    ctx.log.info('aws-util-firecloud.express.bootstrap: Creating HTTP server (handling request)...');
    await ctx.log.trackTime(
      'aws-util-firecloud.express.bootstrap: Creating HTTP server (handling request)...',
      _.promisify(function(done) {
        let http = new LambdaHttp(e, ctx, function(err, resData) {
          if (_.isUndefined(err)) {
            result = resData;
          }
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
