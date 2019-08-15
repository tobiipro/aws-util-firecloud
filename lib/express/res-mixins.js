"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.type = exports.send = exports.addLink = void 0;
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable no-invalid-this */

let addLink = function (link) {
  let {
    target } =
  link;
  delete link.target;
  let linkStr = [
  `<${target}>`];


  // eslint-disable-next-line lodash/prefer-map
  _lodashFirecloud.default.forEach(link, function (value, key) {
    linkStr.push(`${key}="${value}"`);
  });

  linkStr = linkStr.join('; ');
  let linkHeader = _lodashFirecloud.default.defaultTo(this.getHeader('link'), []);
  linkHeader.push(linkStr);
  this.setHeader('link', linkHeader);
};exports.addLink = addLink;

let send = function (body) {
  this.send = this.oldSend;

  let {
    ctx } =
  this;

  if (_lodashFirecloud.default.isDefined(this.validate) &&
  _lodashFirecloud.default.startsWith(this.get('content-type'), this.validate.schema.mediaType))
  {
    let valid = this.validate(body);
    if (!valid) {
      ctx.log.warn({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/res-mixins.js" : __filename, babelFile: "src/express/res-mixins.js", line: 36, column: 7 } }, {
        errors: this.validate.errors,
        body,
        schema: this.validate.schema,
        req: this.req,
        res: this },
      'Response validation failed!');
    }
  }

  return this.send(body);
};exports.send = send;

let type = function (type) {
  if (_lodashFirecloud.default.isUndefined(type)) {
    return;
  }

  this.oldType(type);
};exports.type = type;var _default =

exports;exports.default = _default;

//# sourceMappingURL=res-mixins.js.map