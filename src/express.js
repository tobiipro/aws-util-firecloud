/* eslint-disable no-invalid-this */
import _ from 'lodash-firecloud';
import _express from 'express';
import bearerToken from 'express-bearer-token';
import cors from 'cors';
import http from 'http';
import responseTime from 'response-time';
import urlLib from 'url';

import {
  LambdaHttp
} from 'http-lambda';

import {
  bootstrap as bootstrapLambda,
  getRequestInstance
} from './lambda';

import {
  bootstrap as bootstrapMiddleware
} from './express-middleware';

import {
  format as urlFormat,
  parse as urlParse
} from './url';

let _resAddLink = function(link) {
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

let _resSend = function(oldSend, body, mediaType) {
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

let _resSendError = function(status, extensions = {}) {
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

let _reqGetBody = function() {
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

let _initExpress = function() {
  return bootstrapMiddleware(async function(req, res, next) {
    req.log = req.ctx.log;
    res.log = req.log;
    res.instance = getRequestInstance(req);

    req.getBody = _.memoize(_.bind(_reqGetBody, req));
    req.getSelfUrl = function() {
      return getSelfUrl({req});
    };
    req.getPaginationUrl = function(args) {
      args.req = req;
      return getPaginationUrl(args);
    };

    res.addLink = _.bind(_resAddLink, res);

    let oldSend = res.send;
    res.send = _.bind(_resSend, res, oldSend);
    res.sendError = _.bind(_resSendError, res);
    next();
  });
};

let _xForward = function() {
  return bootstrapMiddleware(async function(req, _res, next) {
    req.headers = _.mapKeys(req.headers, function(_value, key) {
      return _.replace(key, /^X-Forward-/, '');
    });
    next();
  });
};

export let getSelfUrl = function({req}) {
  let {env} = req.ctx;
  let selfUrl = urlParse(`${env.API_SECONDARY_BASE_URL}${req.originalUrl}`);
  return selfUrl;
};

export let getPaginationUrl = function({
  req,
  perPage = per_page, // eslint-disable-line no-use-before-define
  ref,
  // FIXME deprecated
  per_page // eslint-disable-line camelcase
}) {
  let pageUrl = getSelfUrl({req});

  // FIXME use url.URL when AWS Node.js is upgraded from 6.10
  _.merge(pageUrl, {
    query: {
      per_page: perPage,
      ref
    }
  });
  pageUrl = urlParse(urlFormat(pageUrl));
  return pageUrl;
};

export let express = function(e, _ctx, _next) {
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
  app.use(_initExpress());
  app.use(_xForward());

  app.use(bootstrapMiddleware(async function(_req, res, next) {
    res.set('cache-control', 'max-age=0, no-store');
    next();
  }));

  return app;
};

// using console.log instead of the logger on purpose
export let bootstrap = function(fn, {pkg}) {
  return bootstrapLambda(async function(e, ctx, next) {
    let app;
    await _.consoleLogTime(
      'aws-util-firecloud.express.bootstrap: Creating express app...',
      async function() {
        app = express(e, ctx, next);
      }
    );

    await _.consoleLogTime(
      'aws-util-firecloud.express.bootstrap: Setting up custom express...',
      async function() {
        await fn(app, e, ctx, next);
      }
    );

    await _.consoleLogTime(
      'aws-util-firecloud.express.bootstrap: Creating HTTP server (handling request)...',
      async function() {
        let http = new LambdaHttp(e, ctx, next);
        http.createServer(app);
      }
    );
  }, {pkg});
};

export default exports;
