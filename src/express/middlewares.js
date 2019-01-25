import _ from 'lodash-firecloud';
import reqMixins from './req-mixins';
import resMixins from './res-mixins';

import {
  asyncHandler
} from '../lambda';

import {
  bootstrap as bootstrapResponseError
} from './res-error';

export let bootstrap = function(fn) {
  return asyncHandler(async function(req, res, next) {
    bootstrapResponseError(await _.alwaysPromise(fn(req, res, next)), res);
  });
};

export let init = function(req, res, next) {
  _.forEach(reqMixins, function(fn, name) {
    req[name] = _.bind(fn, req);
  });

  res.oldSend = res.send; // required by the res.send mixin
  _.forEach(resMixins, function(fn, name) {
    res[name] = _.bind(fn, res);
  });

  next();
};

export let xForward = function(req, _res, next) {
  req.headers = _.mapKeys(req.headers, function(_value, key) {
    return _.replace(key, /^X-Forward-/, '');
  });
  next();
};

export default exports;
