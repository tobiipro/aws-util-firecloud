import aws from 'aws-sdk';
export declare let getDefaultTotalSegments: (TableName: string) => Promise<number>;
export declare let scanWithBackticks: (args: aws.DynamoDB.DocumentClient.ScanInput) => aws.DynamoDB.DocumentClient.ScanInput;
export declare let dcScan: (args: aws.DynamoDB.DocumentClient.ScanInput, iteratee: any) => Promise<void>;
export declare let dcPut: (args: aws.DynamoDB.DocumentClient.PutItemInput) => Promise<aws.DynamoDB.DocumentClient.PutItemOutput>;
