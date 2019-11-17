// eslint-disable-next-line import/no-unresolved
import awsLambda from 'aws-lambda';
import express from 'express';
import httpLambda from 'http-lambda';

import {
  LambdaContext
} from './types-lambda';

export interface ExpressHandler extends express.Handler {
  disable?: (...args) => any;
}

export interface ExpressApp extends express.Application {
  defaultMiddlewares?: {[key: string]: ExpressHandler;};
}

// ReturnType<ajv.compile>
export type ReturnTypeAjvCompileFn = ((data: any) => boolean) & {
  errors?: any[];
  schema: any;
};

export interface ExpressLambdaRequestExtensions {
  ctx: LambdaContext;
  validate?: ReturnTypeAjvCompileFn;
  getSelfUrl: () => URL;
}

export type ExpressLambdaRequest = httpLambda.IncomingMessage & express.Request & ExpressLambdaRequestExtensions & {
  res: ExpressLambdaResponse;
};

export interface ExpressLambdaResponseExtensions {
  ctx: LambdaContext;
  validate?: ReturnTypeAjvCompileFn;
  oldSend?: (httpLambda.ServerResponse & express.Response)['send'];
  oldType?: (httpLambda.ServerResponse & express.Response)['type'];
}

export type ExpressLambdaResponse = httpLambda.ServerResponse & express.Response & ExpressLambdaResponseExtensions & {
  req: ExpressLambdaRequest;
};

// export type HttpLambdaHandler = (
//   event: awsLambda.APIGatewayEvent,
//   context: LambdaContext,
//   callback?: awsLambda.Callback<awsLambda.APIGatewayProxyResult>
// ) => Promise<void>;

export type ExpressLambdaHandler = (
  app: ExpressApp,
  event: awsLambda.APIGatewayEvent,
  context: LambdaContext,
  callback?: awsLambda.Callback<awsLambda.APIGatewayProxyResult>
) => Promise<void>;
