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

export default ResponseError;
