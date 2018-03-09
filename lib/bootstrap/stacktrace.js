'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// override native Promise to get better stacktraces
global.Promise = _bluebird2.default;
_bluebird2.default.config({
  warnings: true,
  longStackTraces: true
});
Error.stackTraceLimit = Infinity;

//# sourceMappingURL=stacktrace.js.map