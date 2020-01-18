import { ExpressLambdaResponse } from '../types';
export declare let addLink: (this: ExpressLambdaResponse, link: any) => void;
export declare let send: (this: ExpressLambdaResponse, body?: any) => Promise<void>;
export declare let type: (this: ExpressLambdaResponse, type: string) => void;
