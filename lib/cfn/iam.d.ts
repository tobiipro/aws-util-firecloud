import { Env } from '../types';
export declare let addStatementFromArns: ({ Statement, arns, env }: {
    Statement: any;
    arns: any;
    env: any;
}) => Promise<any>;
export declare let compactStatement: ({ Statement }: {
    Statement: any;
}) => {
    Effect: never;
    Principal: never;
    Action: any[];
    Resource: never;
    Condition: never;
}[];
export declare let allowFullAccessToDynamoDbTable: ({ TableName, env }: {
    TableName: any;
    env: any;
}) => {
    Sid: string;
    Effect: string;
    Action: string[];
    Resource: string[];
};
export declare let allowFullAccessToKinesisStream: ({ StreamName, env }: {
    StreamName: any;
    env: any;
}) => {
    Sid: string;
    Effect: string;
    Action: string[];
    Resource: string[];
};
export declare let allowQueryAccessToAthena: ({ env }?: {
    env?: Env;
}) => {
    Sid: string;
    Effect: string;
    Action: string[];
    Resource: string[];
};
export declare let allowAccessToAthenaOutputBucket: ({ region, BucketName, env }: {
    region: any;
    BucketName: any;
    env: any;
}) => {
    Sid: string;
    Effect: string;
    Action: string[];
    Resource: string[];
};
