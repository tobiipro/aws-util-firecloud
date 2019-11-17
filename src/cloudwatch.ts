import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  Fn
} from 'lodash-firecloud/types';

// TODO
// declare module 'aws-sdk/clients/cloudwatch' {
//   interface GetMetricStatisticsInput {
//     StartTime: Date | string | number;
//     EndTime: Date | string | number;
//   }
// }

type DimensionMetric = Omit<aws.CloudWatch.Metric, 'Dimension'> & {
  Dimension: aws.CloudWatch.Dimension;
};

export let listAllMetrics = async function({
  cloudwatch = new aws.CloudWatch(),
  iteratee,
  Token,
  Metrics = []
}: {
  cloudwatch?: aws.CloudWatch;
  iteratee?: Fn<void, [aws.CloudWatch.Metrics]>;
  Token?: aws.CloudWatch.NextToken;
  Metrics?: aws.CloudWatch.Metrics;
} = {}): Promise<aws.CloudWatch.Metrics> {
  let {
    Metrics: newMetrics,
    NextToken
  } = await cloudwatch.listMetrics({NextToken: Token}).promise();


  if (_.isDefined(iteratee)) {
    // eslint-disable-next-line callback-return
    await iteratee(newMetrics);
  } else {
    Metrics = Metrics.concat(newMetrics);
  }

  if (_.isUndefined(NextToken)) {
    return _.isDefined(iteratee) ? undefined : Metrics;
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

export let metricsToDimensionMetrics = function(metrics: aws.CloudWatch.Metrics): DimensionMetric[] {
  let dimensionMetrics = [];

  _.forEach(metrics, function(metric) {
    _.forEach(metric.Dimensions, function(dimension) {
      let dimensionMetric = _.cloneDeep(metric) as DimensionMetric;
      _.unset(dimensionMetric, 'Dimensions');
      dimensionMetric.Dimension = dimension;
      dimensionMetrics.push(dimensionMetric);
    });
  });

  dimensionMetrics = _.uniqBy(dimensionMetrics, function(dimensionMetric) {
    return JSON.stringify(dimensionMetric);
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export let datapointToDmDatapoint = function({dmDatapointTpl, datapoint}) {
  let dmDatapoint = _.cloneDeep(dmDatapointTpl);

  datapoint.Timestamp = new Date(datapoint.Timestamp).toISOString();
  datapoint = _.mapKeys(datapoint, function(_value, key) {
    return _.snakeCase(key);
  });
  dmDatapoint.datapoint = datapoint;

  return dmDatapoint;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export let getDimensionMetricDatapoints = async function({
  cloudwatch,
  dimensionMetric,
  StartTime,
  EndTime,
  Period
}: {
  cloudwatch: aws.CloudWatch;
  dimensionMetric: DimensionMetric;
  StartTime: string | number | Date;
  EndTime: string | number | Date;
  Period: aws.CloudWatch.Period;
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
    // TODO
    // StartTime: new Date(StartTime).toISOString(),
    StartTime: new Date(StartTime),
    // TODO
    // EndTime: new Date(EndTime).toISOString(),
    EndTime: new Date(EndTime),
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
    timestamp: undefined as string,
    region: cloudwatch.config.region,
    namespace: Namespace,
    dimension_name: Dimension.Name,
    dimension_value: Dimension.Value,
    metric_name: MetricName,
    start_time: new Date(StartTime).toISOString(),
    end_time: new Date(EndTime).toISOString(),
    period: Period,
    label: Label,
    datapoint: {} as aws.CloudWatch.Datapoint
  };

  let dmDatapoints = _.map(Datapoints, function(datapoint) {
    return datapointToDmDatapoint({dmDatapointTpl, datapoint});
  });

  return dmDatapoints as (typeof dmDatapointTpl)[];
};

export default exports;
