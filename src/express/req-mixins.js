/* eslint-disable no-invalid-this */
import ResponseError from './res-error';
import _ from 'lodash-firecloud';

import {
  URL
} from 'url';

export let getSelfUrl = function() {
  let {
    env
  } = this.ctx;
  let selfUrl = new URL(`${env.API_SECONDARY_BASE_URL}${this.originalUrl}`);
  return selfUrl;
};

export let getPaginationUrl = function({
  perPage,
  ref
}) {
  let pageUrl = new URL(this.getSelfUrl().toString());
  pageUrl.searchParams.set('per_page', perPage);
  pageUrl.searchParams.set('ref', ref);

  return pageUrl;
};

export let getBody = function() {
  let {
    body
  } = this;
  try {
    if (/[/+]json$/.test(this.get('content-type'))) {
      body = JSON.parse(this.body);
    }
  } catch (syntaxErrors) {
    throw new ResponseError(400, {
      errors: syntaxErrors
    });
  }

  if (!_.isUndefined(this.validate)) {
    let valid = this.validate(body);
    if (!valid) {
      throw new ResponseError(422, {
        errors: this.validate.errors,
        schema: this.validate.schema
      });
    }
  }

  return body;
};

export default exports;
