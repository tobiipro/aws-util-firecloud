/* eslint-disable no-invalid-this */
import _ from 'lodash-firecloud';

export let addLink = function(link) {
  let {target} = link;
  delete link.target;
  let linkStr = [`<${target}>`];

  // eslint-disable-next-line lodash/prefer-map
  _.forEach(link, function(value, key) {
    linkStr.push(`${key}="${value}"`);
  });

  linkStr = linkStr.join('; ');
  let linkHeader = _.defaultTo(this.getHeader('link'), []);
  linkHeader.push(linkStr);
  this.setHeader('link', linkHeader);
};

export let send = function(body, mediaType) {
  this.send = this.oldSend;

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

export let sendError = function(responseError) {
  let {
    code: status,
    contentType,
    body
  } = responseError;

  this.status(status);

  body.instance = this.instance;
  this.send(body, contentType);

  return responseError;
};

export default exports;
