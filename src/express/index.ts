/* eslint-disable no-invalid-this */
import Layer from 'express/lib/router/layer';
import _ from 'lodash-firecloud';
import _express from 'express';
// eslint-disable-next-line import/no-unresolved
import awsLambda from 'aws-lambda';
import bearerToken from 'express-bearer-token';
import cors from 'cors';
import http from 'http';
import middlewares from './middlewares';
import responseTime from 'response-time';

import {
  bootstrap as bootstrapLambda
} from '../lambda';

import {
  ExpressApp,
  ExpressHandler,
  ExpressLambdaHandler,
  ExpressLambdaRequest,
  ExpressLambdaResponse,
  LambdaContext,
  PackageJson
} from '../types';

import {
  LambdaHttp
} from 'http-lambda';

let _bootstrapLayer = function(): void {
  // override Layer.prototype as defined in express@4.16.4
  // eslint-disable-next-line max-params
  Layer.prototype.handle_error = async function(
    this: Layer,
    error: Error,
    req: ExpressLambdaRequest,
    res: ExpressLambdaResponse,
    next: _express.NextFunction
  ) {
    let fn = this.handle;

    if (fn.length !== 4) {
      // not a standard error handler
      return next(error);
    }

    try {
      // original code
      // fn(error, req, res, next);
      await fn(error, req, res, next);
    } catch (err) {
      return next(err);
    }
  };

  // eslint-disable-next-line max-params
  Layer.prototype.handle_request = async function(
    this: Layer,
    req: ExpressLambdaRequest,
    res: ExpressLambdaResponse,
    next: _express.NextFunction
  ) {
    let fn = this.handle;

    if (fn.length > 3) {
      // not a standard request handler
      return next();
    }

    try {
      // original code
      // fn(req, res, next);
      await fn(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};

let _bootstrap = async function(
  fn: ExpressLambdaHandler,
  e: awsLambda.APIGatewayEvent,
  ctx: LambdaContext
): Promise<ExpressApp> {
  _bootstrapLayer();
  let app = _express() as ExpressApp;

  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.set('json spaces', 2);

  let defaultMiddlewares = {} as {[key: string]: ExpressHandler;};
  defaultMiddlewares.responseTime = responseTime();
  defaultMiddlewares.cors = cors({
    exposedHeaders: [
      'date',
      'etag',
      'link',
      'location',
      'x-response-time'
    ],
    maxAge: 24 * 60 * 60 // 24 hours
  });
  defaultMiddlewares.bearerToken = bearerToken();
  defaultMiddlewares.applyMixins = middlewares.applyMixins();
  defaultMiddlewares.xForward = middlewares.xForward();
  defaultMiddlewares.noCache = function(_req, res, next) {
    res.set('cache-control', 'max-age=0, no-store');
    next();
  };

  _.forEach(defaultMiddlewares, function(middleware, name) {
    middleware.disable = function() {
      defaultMiddlewares[name] = function(_req, _res, next) {
        next();
      };
    };

    app.use(function(req, res, next) {
      defaultMiddlewares[name](req, res, next);
    });
  });

  app.defaultMiddlewares = defaultMiddlewares;

  await fn(app, e, ctx);

  // error handlers need to be registered last
  app.use(middlewares.handleResponseError());

  return app;
};

export let bootstrap = function<
  TEvent extends awsLambda.APIGatewayEvent = awsLambda.APIGatewayEvent,
  TResult extends awsLambda.APIGatewayProxyResult = awsLambda.APIGatewayProxyResult
>(fn: ExpressLambdaHandler, {
  pkg
}: {
  pkg: PackageJson;
}): awsLambda.Handler<TEvent, TResult> {
  // @ts-ignore
  return bootstrapLambda<TEvent, TResult>(
    async function(e: TEvent, ctx: LambdaContext) {
      let app: ExpressApp;
      await ctx.log.trackTime(
        'Creating express app...',
        async function() {
          app = await _bootstrap(fn, e, ctx);
        }
      );

      let result: TResult;
      ctx.log.info(`Handling ${e.httpMethod} ${e.path}...`);
      await ctx.log.trackTime(
        'Creating HTTP server (handling request)...',
        _.promisify(function(done: (err?: Error) => void) {
          let http = new LambdaHttp(e, ctx, function(err: Error, resData) {
            if (_.isUndefined(err)) {
              result = resData as TResult;
            }
            done(err);
          });
          http.createServer(app);
        })
      );

      ctx.log.info(`Handled with ${result.statusCode} ${http.STATUS_CODES[result.statusCode]}...`);
      return result;
    }, {
      pkg
    });
};

export default exports;
