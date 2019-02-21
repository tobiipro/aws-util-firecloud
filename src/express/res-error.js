import _ from 'lodash-firecloud';
import http from 'http';

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

export let bootstrap = function(fn, _res) {
  return async function(...args) {
    return await _.alwaysPromise(fn(...args));
  };
};

export default ResponseError;
