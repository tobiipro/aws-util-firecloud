"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ResponseError = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _http = _interopRequireDefault(require("http"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class ResponseError extends Error {
  constructor(status, extensions = {}) {
    super(_http.default.STATUS_CODES[status]);

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