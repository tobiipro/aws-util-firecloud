'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listAllMetrics = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let listAllMetrics = exports.listAllMetrics = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    cloudwatch = new _awsSdk2.default.CloudWatch(),
    iteratee = undefined,
    Token = undefined,
    Metrics = []
  } = {}) {
    let {
      Metrics: newMetrics,
      NextToken
    } = yield cloudwatch.listMetrics({ NextToken: Token }).promise();

    if (_lodashFirecloud2.default.isFunction(iteratee)) {
      // eslint-disable-next-line callback-return
      yield iteratee(newMetrics);
    } else {
      Metrics = Metrics.concat(newMetrics);
    }

    if (!NextToken) {
      return _lodashFirecloud2.default.isFunction(iteratee) ? undefined : Metrics;
    }

    return exports.listAllMetrics({ Token: NextToken, Metrics });
  });

  return function listAllMetrics() {
    return _ref.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=cloudwatch.js.map