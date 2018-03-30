import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

export let listAllMetrics = async function({
  cloudwatch = new aws.CloudWatch(),
  iteratee = undefined,
  Token = undefined,
  Metrics = []
} = {}) {
  let {
    Metrics: newMetrics,
    NextToken
  } = await cloudwatch.listMetrics({NextToken: Token}).promise();


  if (_.isFunction(iteratee)) {
    // eslint-disable-next-line callback-return
    await iteratee(newMetrics);
  } else {
    Metrics = Metrics.concat(newMetrics);
  }

  if (!NextToken) {
    return _.isFunction(iteratee) ? undefined : Metrics;
  }

  return listAllMetrics({Token: NextToken, Metrics});
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
*/

export let metricsToDimensionMetrics = function(metrics) {
  let dimensionMetrics = [];

  _.forEach(metrics, function(metric) {
    _.forEach(metric.Dimensions, function(dimension) {
      let dimensionMetric = _.cloneDeep(metric);
      _.unset(metric, 'Dimensions');
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

export let datapointToDmDatapoint = function({dmDatapointTpl, datapoint}) {
  let dmDatapoint = _.cloneDeep(dmDatapointTpl);

  datapoint.Timestamp = new Date(datapoint.Timestamp).toISOString();
  datapoint = _.mapKeys(datapoint, function(_value, key) {
    return _.snakeCase(key);
  });
  dmDatapoint.datapoint = datapoint;

  return dmDatapoint;
};

export let getDimensionMetricDatapoints = async function({
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
  } = await cloudwatch.getMetricStatistics({
    Namespace,
    Dimensions: [
      Dimension
    ],
    MetricName,
    StartTime: new Date(StartTime).toISOString(),
    EndTime: new Date(EndTime).toISOString(),
    Period,
    Statistics: [
      'Average',
      'Maximum',
      'Minimum',
      'SampleCount',
      'Sum'
    ]
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

  let dmDatapoints = _.map(Datapoints, function(datapoint) {
    return datapointToDmDatapoint({dmDatapointTpl, datapoint});
  });

  return dmDatapoints;
};

export default exports;
