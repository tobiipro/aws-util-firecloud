import awsLambda from 'aws-lambda';
import { ExpressLambdaHandler, PackageJson } from '../types';
export declare let bootstrap: <TEvent extends awsLambda.APIGatewayProxyEvent = awsLambda.APIGatewayProxyEvent, TResult extends awsLambda.APIGatewayProxyResult = awsLambda.APIGatewayProxyResult>(fn: ExpressLambdaHandler, { pkg }: {
    pkg: PackageJson;
}) => awsLambda.Handler<TEvent, TResult>;
