import _ from 'lodash-firecloud';
import http from 'http';

export class ResponseError extends Error {
  constructor(status, extensions = {}) {
    super(http.STATUS_CODES[status]);

    this.code = status;
    this.contentType = 'application/problem+json';
    let body = _.merge({
      type: 'about:blank',
      title: this.message,
      status: this.code
    }, extensions);
    this.body = body;
  }
}

export default ResponseError;
