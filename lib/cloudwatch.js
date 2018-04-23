'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDimensionMetricDatapoints = exports.datapointToDmDatapoint = exports.metricsToDimensionMetrics = exports.listAllMetrics = undefined;

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

    return listAllMetrics({ Token: NextToken, Metrics });
  });

  return function listAllMetrics() {
    return _ref.apply(this, arguments);
  };
})();

/*
  metrics = [{
    Namespace: '...',
    MetricName: '...',
    Dimensions: [{
      Name: '...',
      Value: '...'
    }]
  }];

  dimensionMetrics = [{
    Namespace: '...',
    MetricName: '...',
    Dimension: { // only 1 dimension
      Name: '...',
      Value: '...'
    }
  }];
*/

let metricsToDimensionMetrics = exports.metricsToDimensionMetrics = function (metrics) {
  let dimensionMetrics = [];

  _lodashFirecloud2.default.forEach(metrics, function (metric) {
    _lodashFirecloud2.default.forEach(metric.Dimensions, function (dimension) {
      let dimensionMetric = _lodashFirecloud2.default.cloneDeep(metric);
      _lodashFirecloud2.default.unset(metric, 'Dimensions');
      dimensionMetric.Dimension = dimension;
      dimensionMetrics.push(dimensionMetric);
    });
  });

  return dimensionMetrics;
};

/*
  dmDatapoint = {
    region: '...'
    namespace: '...',
    dimension_name: '...',
    dimension_value: '...',
    start_time: '...',
    end_time: '...',
    period: ...,
    label: '...',
    datapoint: {
      timestamp: '...',
      <statistic>: ...,
      unit: '...'
    }
  }
*/

let datapointToDmDatapoint = exports.datapointToDmDatapoint = function ({ dmDatapointTpl, datapoint }) {
  let dmDatapoint = _lodashFirecloud2.default.cloneDeep(dmDatapointTpl);

  datapoint.Timestamp = new Date(datapoint.Timestamp).toISOString();
  datapoint = _lodashFirecloud2.default.mapKeys(datapoint, function (_value, key) {
    return _lodashFirecloud2.default.snakeCase(key);
  });
  dmDatapoint.datapoint = datapoint;

  return dmDatapoint;
};

let getDimensionMetricDatapoints = exports.getDimensionMetricDatapoints = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* ({
    cloudwatch,
    dimensionMetric,
    StartTime,
    EndTime,
    Period
  }) {
    let {
      Namespace,
      Dimension,
      MetricName
    } = dimensionMetric;

    let {
      Datapoints,
      Label
    } = yield cloudwatch.getMetricStatistics({
      Namespace,
      Dimensions: [Dimension],
      MetricName,
      StartTime: new Date(StartTime).toISOString(),
      EndTime: new Date(EndTime).toISOString(),
      Period,
      Statistics: ['Average', 'Maximum', 'Minimum', 'SampleCount', 'Sum']
    }).promise();

    let dmDatapointTpl = {
      region: cloudwatch.config.region,
      namespace: Namespace,
      dimension_name: Dimension.Name,
      dimension_value: Dimension.Value,
      metric_name: MetricName,
      start_time: StartTime.toISOString(),
      end_time: EndTime.toISOString(),
      period: Period,
      label: Label,
      datapoint: {}
    };

    let dmDatapoints = _lodashFirecloud2.default.map(Datapoints, function (datapoint) {
      return exports.datapointToDmDatapoint({ dmDatapointTpl, datapoint });
    });

    return dmDatapoints;
  });

  return function getDimensionMetricDatapoints(_x) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=cloudwatch.js.map