import awsLambda from 'aws-lambda';
import { LambdaContext, LambdaHandler, PackageJson } from '../types';
export declare let getRequestInstance: ({ ctx }: {
    ctx: LambdaContext;
}) => string;
export declare let bootstrap: <TEvent extends any, TResult extends any>(fn: LambdaHandler<TEvent, TResult>, { pkg }: {
    pkg: PackageJson;
}) => awsLambda.Handler<any, any>;
