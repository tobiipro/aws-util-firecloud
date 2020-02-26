"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.type = exports.send = exports.addLink = void 0;
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable babel/no-invalid-this */





let addLink = function (link) {
  let {
    target } =
  link;
  delete link.target;
  let linkItemComponents = [
  `<${target}>`];


  // eslint-disable-next-line lodash/prefer-map
  _lodashFirecloud.default.forEach(link, function (value, key) {
    linkItemComponents.push(`${key}="${value}"`);
  });

  let linkItem = linkItemComponents.join('; ');
  let linkHeader = _lodashFirecloud.default.defaultTo(this.getHeader('link'), []);
  linkHeader.push(linkItem);
  this.setHeader('link', linkHeader);
};exports.addLink = addLink;

let send = async function (body) {
  // @ts-ignore
  this.send = this.oldSend;

  let {
    ctx } =
  this;

  if (_lodashFirecloud.default.isDefined(this.validate) &&
  _lodashFirecloud.default.startsWith(this.get('content-type'), this.validate.schema.mediaType))
  {
    let valid = this.validate(body);
    if (!valid) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ctx.log.warn({ _babelSrc: { file: typeof __filename === "undefined" ? "src/express/res-mixins.ts" : __filename, babelFile: "src/express/res-mixins.ts", line: 42, column: 7 } }, {
        errors: this.validate.errors,
        body,
        schema: this.validate.schema,
        req: this.req,
        res: this },
      'Response validation failed!');
    }
  }

  this.send(body);
};exports.send = send;

let type = function (type) {
  if (_lodashFirecloud.default.isUndefined(type)) {
    return;
  }

  this.oldType(type);
};exports.type = type;

//# sourceMappingURL=res-mixins.js.map