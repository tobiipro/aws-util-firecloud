"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ResponseError = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _http = _interopRequireDefault(require("http"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}





class ResponseError extends Error {






  constructor(status, extensions = {}) {
    super(_http.default.STATUS_CODES[status]);_defineProperty(this, "code", void 0);_defineProperty(this, "contentType", void 0);_defineProperty(this, "body", void 0);

    this.code = status;
    this.contentType = 'application/problem+json';
    let body = _lodashFirecloud.default.merge({
      type: 'about:blank',
      title: this.message,
      status: this.code },
    extensions);
    this.body = body;
  }}exports.ResponseError = ResponseError;var _default =


ResponseError;exports.default = _default;

//# sourceMappingURL=res-error.js.map