import aws from 'aws-sdk';
import { Env } from './types';
export declare let getDatabaseName: ({ env, region }: {
    env: Env;
    region?: string;
}) => string;
export declare let getOutputBucketName: ({ env, region }: {
    env: Env;
    region?: string;
}) => string;
export declare let pollQueryCompletedState: ({ athena, QueryExecutionId, pollingDelay }: {
    athena: aws.Athena;
    QueryExecutionId: string;
    pollingDelay: number;
}) => Promise<string>;
export declare let queryResultToObjectsArray: (queryResult: aws.Athena.GetQueryResultsOutput) => object[];
export declare let queryResultToText: (queryResult: aws.Athena.GetQueryResultsOutput) => string;
export declare let queryResultIsShowResult: (queryResult: aws.Athena.GetQueryResultsOutput) => boolean;
export declare let executeQuery: ({ athena, params, pollingDelay, initPollingDelay }: {
    athena: aws.Athena;
    params: aws.Athena.StartQueryExecutionInput;
    pollingDelay: number;
    initPollingDelay: number;
}) => Promise<string | object[]>;
