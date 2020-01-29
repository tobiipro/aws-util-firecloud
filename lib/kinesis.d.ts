import aws from 'aws-sdk';
import { LambdaContext } from './types';
export declare let limits: {
    batchByteSize: number;
    batchRecord: number;
    recordByteSize: number;
};
export declare let putRecords: ({ ExplicitHashKey, PartitionKey, StreamName, ctx, kinesis, records }: {
    ExplicitHashKey: string;
    PartitionKey: string;
    StreamName: string;
    ctx: LambdaContext;
    kinesis: aws.Kinesis;
    records: any[];
}) => Promise<void | {
    largeRecords: aws.Kinesis.PutRecordsRequestEntry[];
}>;
