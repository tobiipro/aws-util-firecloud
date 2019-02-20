import _ from 'lodash-firecloud';
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

export default exports;
