'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.format = exports.parse = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let parse = exports.parse = function (url) {
  // FIXME use url.URL when AWS Node.js is upgraded from 6.10
  return _url2.default.parse(url, true, true);
};

let format = exports.format = function (url) {
  // FIXME use url.URL when AWS Node.js is upgraded from 6.10
  url = _lodashFirecloud2.default.omit(url, ['host', 'href', 'path', 'search']);

  return _url2.default.format(url);
};

//# sourceMappingURL=url.js.map