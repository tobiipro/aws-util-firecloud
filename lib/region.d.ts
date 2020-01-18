import { Env, Region } from './types';
export declare let chinaRegions: string[];
export declare let regions: string[];
export declare let get: ({ env }: {
    env: Env;
}) => string;
export declare let getDomain: ({ env, region }: {
    env: Env;
    region?: string;
}) => string;
export declare let current: Region;
export declare let currentProxy: {};
export default currentProxy;
