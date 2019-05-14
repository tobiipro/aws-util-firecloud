/* eslint-disable no-invalid-this */
import _ from 'lodash-firecloud';

export let addLink = function(link) {
  let {
    target
  } = link;
  delete link.target;
  let linkStr = [
    `<${target}>`
  ];

  // eslint-disable-next-line lodash/prefer-map
  _.forEach(link, function(value, key) {
    linkStr.push(`${key}="${value}"`);
  });

  linkStr = linkStr.join('; ');
  let linkHeader = _.defaultTo(this.getHeader('link'), []);
  linkHeader.push(linkStr);
  this.setHeader('link', linkHeader);
};

export let send = function(body) {
  this.send = this.oldSend;

  let {
    ctx
  } = this;

  if (_.isDefined(this.validate) &&
      _.startsWith(this.get('content-type'), this.validate.schema.mediaType)
  ) {
    let valid = this.validate(body);
    if (!valid) {
      ctx.log.warn({
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

export let type = function(type) {
  if (_.isUndefined(type)) {
    return;
  }

  this.oldType(type);
};

export default exports;
