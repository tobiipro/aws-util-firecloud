import { Env } from './types';
export declare let getProjectBucketName: ({ prefix, env, region }: {
    prefix: string;
    env: Env;
    region?: string;
}) => string;
export declare let getAccountBucketName: ({ prefix, env, region }: {
    prefix: string;
    env: Env;
    region?: string;
}) => string;
export declare let getEnvBucketName: ({ prefix, env, region }: {
    prefix: string;
    env: Env;
    region?: string;
}) => string;
export declare let getBucketDomainName: ({ BucketName, env, region }: {
    BucketName: string;
    env: Env;
    region?: string;
}) => string;
export declare let getDomain: ({ env, region }: {
    env: Env;
    region?: string;
}) => string;
export declare let getWebsiteDomain: ({ env, region }: {
    env: Env;
    region?: string;
}) => string;
