"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.getDimensionMetricDatapoints = exports.datapointToDmDatapoint = exports.metricsToDimensionMetrics = exports.listAllMetrics = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let listAllMetrics = async function ({
  cloudwatch = new _awsSdk.default.CloudWatch(),
  iteratee = undefined,
  Token = undefined,
  Metrics = [] } =
{}) {
  let {
    Metrics: newMetrics,
    NextToken } = await (async createError => {try {return (
        await cloudwatch.listMetrics({ NextToken: Token }).promise());} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  if (_lodashFirecloud.default.isFunction(iteratee)) {
    // eslint-disable-next-line callback-return
    await (async createError => {try {return await iteratee(newMetrics);} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
  } else {
    Metrics = Metrics.concat(newMetrics);
  }

  if (!NextToken) {
    return _lodashFirecloud.default.isFunction(iteratee) ? undefined : Metrics;
  }

  return listAllMetrics({ Token: NextToken, Metrics });
};

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
   */exports.listAllMetrics = listAllMetrics;

let metricsToDimensionMetrics = function (metrics) {
  let dimensionMetrics = [];

  _lodashFirecloud.default.forEach(metrics, function (metric) {
    _lodashFirecloud.default.forEach(metric.Dimensions, function (dimension) {
      let dimensionMetric = _lodashFirecloud.default.cloneDeep(metric);
      _lodashFirecloud.default.unset(dimensionMetric, 'Dimensions');
      dimensionMetric.Dimension = dimension;
      dimensionMetrics.push(dimensionMetric);
    });
  });

  dimensionMetrics = _lodashFirecloud.default.uniqBy(dimensionMetrics, _lodashFirecloud.default.unary(JSON.stringify));
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
   */exports.metricsToDimensionMetrics = metricsToDimensionMetrics;

let datapointToDmDatapoint = function ({ dmDatapointTpl, datapoint }) {
  let dmDatapoint = _lodashFirecloud.default.cloneDeep(dmDatapointTpl);

  datapoint.Timestamp = new Date(datapoint.Timestamp).toISOString();
  datapoint = _lodashFirecloud.default.mapKeys(datapoint, function (_value, key) {
    return _lodashFirecloud.default.snakeCase(key);
  });
  dmDatapoint.datapoint = datapoint;

  return dmDatapoint;
};exports.datapointToDmDatapoint = datapointToDmDatapoint;

let getDimensionMetricDatapoints = async function ({
  cloudwatch,
  dimensionMetric,
  StartTime,
  EndTime,
  Period })
{
  let {
    Namespace,
    Dimension,
    MetricName } =
  dimensionMetric;

  let {
    Datapoints,
    Label } = await (async createError => {try {return (
        await cloudwatch.getMetricStatistics({
          Namespace,
          Dimensions: [
          Dimension],

          MetricName,
          StartTime: new Date(StartTime).toISOString(),
          EndTime: new Date(EndTime).toISOString(),
          Period,
          Statistics: [
          'Average',
          'Maximum',
          'Minimum',
          'SampleCount',
          'Sum'] }).

        promise());} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());

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
    datapoint: {} };


  let dmDatapoints = _lodashFirecloud.default.map(Datapoints, function (datapoint) {
    return exports.datapointToDmDatapoint({ dmDatapointTpl, datapoint });
  });

  return dmDatapoints;
};exports.getDimensionMetricDatapoints = getDimensionMetricDatapoints;var _default =

exports;exports.default = _default;

//# sourceMappingURL=cloudwatch.js.map