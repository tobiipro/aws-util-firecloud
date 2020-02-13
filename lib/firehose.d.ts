import aws from 'aws-sdk';
import { LambdaContext } from './types';
export declare let limits: {
    batchByteSize: number;
    batchRecord: number;
    recordByteSize: number;
};
export declare let putRecords: ({ DeliveryStreamName, ctx, firehose, records }: {
    DeliveryStreamName: string;
    ctx: LambdaContext;
    firehose: aws.Firehose;
    records: aws.Firehose.Record[];
}) => Promise<void | {
    largeRecords: aws.Firehose.Record[];
}>;
