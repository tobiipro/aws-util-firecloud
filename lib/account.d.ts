import { Account, Env } from './types';
export declare let get: ({ env }: {
    env: Env;
}) => {
    [key: string]: Account;
};
export declare let current: Env;
export declare let currentProxy: Env;
export default currentProxy;
