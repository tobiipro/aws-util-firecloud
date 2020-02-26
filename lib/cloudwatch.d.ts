import aws from 'aws-sdk';
import { Fn } from 'lodash-firecloud/types';
declare type DimensionMetric = Omit<aws.CloudWatch.Metric, 'Dimension'> & {
    Dimension: aws.CloudWatch.Dimension;
};
export declare let listAllMetrics: ({ cloudwatch, iteratee, Token, Metrics }?: {
    cloudwatch?: aws.CloudWatch;
    iteratee?: Fn<void, [aws.CloudWatch.Metrics]>;
    Token?: string;
    Metrics?: aws.CloudWatch.Metrics;
}) => Promise<aws.CloudWatch.Metrics>;
export declare let metricsToDimensionMetrics: (metrics: aws.CloudWatch.Metrics) => DimensionMetric[];
export declare let datapointToDmDatapoint: ({ dmDatapointTpl, datapoint }: {
    dmDatapointTpl: any;
    datapoint: any;
}) => any;
export declare let getDimensionMetricDatapoints: ({ cloudwatch, dimensionMetric, StartTime, EndTime, Period }: {
    cloudwatch: aws.CloudWatch;
    dimensionMetric: DimensionMetric;
    StartTime: string | number | Date;
    EndTime: string | number | Date;
    Period: number;
}) => Promise<{
    timestamp: string;
    region: string;
    namespace: string;
    dimension_name: string;
    dimension_value: string;
    metric_name: string;
    start_time: string;
    end_time: string;
    period: number;
    label: string;
    datapoint: aws.CloudWatch.Datapoint;
}[]>;
export {};
