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
export default getCodeChecksumVariables;
