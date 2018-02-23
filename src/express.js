/* eslint-disable no-invalid-this */
import _ from 'lodash-firecloud';
import _express from 'express';
import bearerToken from 'express-bearer-token';
import cors from 'cors';
import http from 'http';
import responseTime from 'response-time';
import url from 'url';

import {
  httpLambda
} from 'http-lambda';

import {
  bootstrap as bootstrapMiddleware
} from './express-middleware';

import {
  bootstrap as bootstrapLambda,
  getRequestInstance
} from './lambda';

export let _resAddLink = function(link) {
  let {target} = link;
  delete link.target;
  let linkStr = [`<${target}>`];

  // eslint-disable-next-line lodash/prefer-map
  _.forEach(link, function(value, key) {
    linkStr.push(`${key}="${value}"`);
  });

  linkStr = linkStr.join('; ');
  this._headers.link = _.defaultTo(this._headers.link, []);
  this._headers.link.push(linkStr);
};

export let _resSend = function(oldSend, body, mediaType) {
  this.send = oldSend;

  if (mediaType) {
    this.set('content-type', mediaType);
  }

  if (!_.isUndefined(this.validate) &&
      _.startsWith(this.get('content-type'), this.validate.schema.mediaType)
    ) {
    let valid = this.validate(body);
    if (!valid) {
      this.log.error({
        errors: this.validate.errors,
        body,
        schema: this.validate.schema,
        req: this.req,
        res: this
      }, 'Response validation failed!');
    }
  }

  return this.send(body);
};

export let _resSendError = function(status, extensions = {}) {
  this.status(status);

  let contentType = 'application/problem+json';
  let body = _.merge({
    type: 'about:blank',
    title: http.STATUS_CODES[status],
    status,
    instance: this.instance
  }, extensions);
  this.send(body, contentType);

  let err = new Error();
  err.contentType = 'application/problem+json';
  err.body = body;
  return err;
};

export let _reqGetBody = function() {
  let {body} = this;
  try {
    if (/[/+]json$/.test(this.get('content-type'))) {
      body = JSON.parse(this.body);
    }
  } catch (syntaxErrors) {
    return this.res.sendError(400, {errors: syntaxErrors});
  }

  if (!_.isUndefined(this.validate)) {
    let valid = this.validate(body);
    if (!valid) {
      return this.res.sendError(422, {
        errors: this.validate.errors,
        schema: this.validate.schema
      });
    }
  }

  return body;
};

export let _initExpress = function() {
  return bootstrapMiddleware(async function(req, res, next) {
    req.log = req.ctx.log;
    res.log = req.log;
    res.instance = getRequestInstance(req);
    req.getBody = _.memoize(exports._reqGetBody.bind(req));
    let oldSend = res.send;
    res.addLink = _.bind(exports._resAddLink, res);
    res.send = _.bind(exports._resSend, res, oldSend);
    res.sendError = _.bind(exports._resSendError, res);
    next();
  });
};

export let _xForward = function() {
  return bootstrapMiddleware(async function(req, _res, next) {
    req.headers = _.mapKeys(req.headers, function(_value, key) {
      return _.replace(key, /^X-Forward-/, '');
    });
    next();
  });
};

export let getSelfUrl = function({req}) {
  let {env} = req.ctx;
  let selfUrl = url.parse(`${env.API_SECONDARY_BASE_URL}${req.originalUrl}`, true, true);
  delete selfUrl.search;
  return selfUrl;
};

export let getPageUrl = function({req, per_page, ref}) {
  let pageUrl = exports.getSelfUrl({req});
  _.merge(pageUrl, {
    query: {
      per_page,
      ref
    }
  });
  return pageUrl;
};

export let express = function({e}) {
  let app = _express();

  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.set('json spaces', 2);
  app.validate = exports.validate;

  // FIXME hack!!!
  let host = _.get(e, 'headers.Host', _.get(e, 'headers.host'));
  if (_.startsWith(host, 'api-git.')) {
    // using the api-git apigateway-domainname (ci stack)
    let basePath = _.split(url.parse(e.path).pathname, '/')[1];
    app.lazyrouter();
    app.use(`/${basePath}`, app._router);
  }

  app.use(responseTime());
  app.use(cors({
    allowedHeaders: [
      'authorization',
      'content-type',
      'If-Match'
    ],
    maxAge: 24 * 60 * 60 // 24 hours
  }));
  app.use(bearerToken());
  app.use(exports._initExpress());
  app.use(exports._xForward());

  app.use(bootstrapMiddleware(async function(_req, res, next) {
    res.set('cache-control', 'max-age=0, no-store');
    next();
  }));

  return app;
};

// using console.log instead of the logger on purpose
export let bootstrap = function(fn, {pkg}) {
  return bootstrapLambda(async function(e, ctx, next) {
    // eslint-disable-next-line no-console
    console.log('aws-util-firecloud.express.bootstrap: Setting up timeout handler...');

    let timeoutInterval = setInterval(function() {
      // FIXME this could be simulated as well for a lambda-proxy environment, but not now
      if (!ctx.getRemainingTimeInMillis) {
        return;
      }
      let remainingTimeInMillis = ctx.getRemainingTimeInMillis();
      if (remainingTimeInMillis > 1000) {
        return;
      }

      clearInterval(timeoutInterval);

      let status = 524;
      let title = 'A Timeout Occurred';

      if (_.includes([
        'OPTIONS',
        'HEAD',
        'GET'
      ], e.httpMethod)) {
        // signal API gateway to retry request
        // see https://docs.aws.amazon.com/apigateway/api-reference/handling-errors/
        status = 503;
        title = 'Service Unavailable';
      }

      // eslint-disable-next-line no-console
      console.error(`aws-util-firecloud.express.bootstrap: Lambda will timeout in ${remainingTimeInMillis} ms`);
      // eslint-disable-next-line no-console
      console.error(`aws-util-firecloud.express.bootstrap: Terminating with ${status} ${title}...`);

      next(undefined, { // eslint-disable-line callback-return
        statusCode: 524,
        headers: {
          'content-type': 'application/problem+json'
        },
        body: JSON.stringify({
          type: 'about:blank',
          title,
          status,
          instance: getRequestInstance({ctx}),
          renderer: 'lambda-util'
        })
      });

      // don't process.exit()
    }, 500);

    await _.consoleLogTime('aws-util-firecloud.express.bootstrap: Running httpLambda...', async function() {
      httpLambda(function(http, e, ctx, _next) {
        (async function() {
          let app;

          await _.consoleLogTime(
            'aws-util-firecloud.express.bootstrap: Creating express app...',
            async function() {
              app = exports.express({e});
            }
          );

          await _.consoleLogTime(
            'aws-util-firecloud.express.bootstrap: Setting up custom express...',
            async function() {
              await fn(app, e, ctx, next);
            }
          );

          await _.consoleLogTime(
            'aws-util-firecloud.express.bootstrap: Creating HTTP server = running request...',
            async function() {
              http.createServer(app);
            }
          );
        })();
      })(e, ctx, function() {
        clearInterval(timeoutInterval);
        // eslint-disable-next-line fp/no-arguments
        next(...arguments);
      });
    });
  }, {pkg});
};

export default exports;
