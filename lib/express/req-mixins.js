"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getBody = exports.getPaginationUrl = exports.getSelfUrl = void 0;
var _resError = _interopRequireDefault(require("./res-error"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));









var _url = require("url");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable babel/no-invalid-this */



let getSelfUrl = function () {
  let {
    env } =
  this.ctx;
  let selfUrl = new _url.URL(`${env.API_SECONDARY_BASE_URL}${this.originalUrl}`);
  return selfUrl;
};exports.getSelfUrl = getSelfUrl;

let getPaginationUrl = function ({
  perPage,
  ref })



{
  let pageUrl = new _url.URL(this.getSelfUrl().toString());
  pageUrl.searchParams.set('per_page', _lodashFirecloud.default.toString(perPage));
  pageUrl.searchParams.set('ref', ref);

  return pageUrl;
};exports.getPaginationUrl = getPaginationUrl;

let getBody = function () {
  let {
    body } =
  this;
  try {
    if (/[/+]json$/.test(this.get('content-type'))) {
      body = JSON.parse(this.body);
    }
  } catch (syntaxErrors) {
    throw new _resError.default(400, {
      errors: syntaxErrors });

  }

  if (_lodashFirecloud.default.isDefined(this.validate)) {
    let valid = this.validate(body);
    if (!valid) {
      throw new _resError.default(422, {
        errors: this.validate.errors,
        schema: this.validate.schema });

    }
  }

  return body;
};exports.getBody = getBody;

//# sourceMappingURL=req-mixins.js.map