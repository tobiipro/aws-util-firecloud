/* eslint-disable babel/no-invalid-this */
import _ from 'lodash-firecloud';

import {
  ExpressLambdaResponse
} from '../types';

export let addLink = function(this: ExpressLambdaResponse, link): void {
  let {
    target
  } = link;
  delete link.target;
  let linkItemComponents = [
    `<${target}>`
  ];

  // eslint-disable-next-line lodash/prefer-map
  _.forEach(link, function(value, key) {
    linkItemComponents.push(`${key}="${value}"`);
  });

  let linkItem = linkItemComponents.join('; ');
  let linkHeader = _.defaultTo(this.getHeader('link'), []) as string[];
  linkHeader.push(linkItem);
  this.setHeader('link', linkHeader);
};

export let send = async function(this: ExpressLambdaResponse, body?: any): Promise<void> {
  // @ts-ignore
  this.send = this.oldSend;

  let {
    ctx
  } = this;

  if (_.isDefined(this.validate) &&
      _.startsWith(this.get('content-type'), this.validate.schema.mediaType)
  ) {
    let valid = this.validate(body);
    if (!valid) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ctx.log.warn({
        errors: this.validate.errors,
        body,
        schema: this.validate.schema,
        req: this.req,
        res: this
      }, 'Response validation failed!');
    }
  }

  this.send(body);
};

export let type = function(this: ExpressLambdaResponse, type: string): void {
  if (_.isUndefined(type)) {
    return;
  }

  this.oldType(type);
};
