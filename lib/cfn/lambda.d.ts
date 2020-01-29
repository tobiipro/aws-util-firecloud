import { Env } from '../types';
export declare let getCodeChecksumVariables: ({ Code, FunctionName, env, force }: {
    Code: any;
    FunctionName: any;
    env: any;
    force?: boolean;
}) => Promise<{
    LAMBDA_CODE_SHA256SUM: any;
    LAMBDA_CODE_SHA256SUM_CORE: any;
    LAMBDA_CODE_S3BUCKET: any;
    LAMBDA_CODE_S3KEY: any;
}>;
export declare let getCodeChecksums: ({ Code, algorithm, env }: {
    Code: any;
    algorithm?: string;
    env: any;
}) => Promise<any[]>;
export declare let getPolicyStatement: ({ env }?: {
    env?: Env;
}) => any[];
export declare let getPolicy: ({ env }: {
    env?: Env;
}) => {
    Type: string;
    Properties: {
        Description: string;
        PolicyDocument: {
            Version: string;
            Statement: any[];
        };
    };
};
export declare let getRole: ({ env }: {
    env: any;
}) => {
    Type: string;
    Properties: {
        AssumeRolePolicyDocument: {
            Statement: {
                Effect: string;
                Principal: import("../types-core").Principal;
                Action: string;
            }[];
        };
        ManagedPolicyArns: any[];
    };
};
export declare let getLogGroup: ({ functionName, _env }: {
    functionName: any;
    _env: any;
}) => {
    DeletionPolicy: string;
    Type: string;
    Properties: {
        LogGroupName: string;
        RetentionInDays: number;
    };
};
export declare let maybeReuseCode: ({ Lambda, env }: {
    Lambda: any;
    env: any;
}) => Promise<void>;
