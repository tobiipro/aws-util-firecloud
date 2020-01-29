import httpLambda from 'http-lambda';
import { Env } from './types-core';
import { MinLog } from 'minlog';
export interface LambdaLoggerExtensions {
    _canTrace: boolean;
    level: () => string;
}
export declare type LambdaLogger = MinLog & LambdaLoggerExtensions;
export interface LambdaContextExtensions {
    env: Env;
    log: LambdaLogger;
}
export declare type LambdaEvent = any;
export declare type LambdaResult = any;
export declare type LambdaContext = httpLambda.ServerResponse['ctx'] & LambdaContextExtensions;
export declare type LambdaHandler<TEvent extends LambdaEvent, TResult extends LambdaResult> = (event: TEvent, context: LambdaContext) => Promise<TResult>;
