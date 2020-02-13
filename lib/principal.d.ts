import { Env, Principal } from './types';
export declare let get: ({ service, env, region }: {
    service: string;
    env: Env;
    region?: string;
}) => Principal;
