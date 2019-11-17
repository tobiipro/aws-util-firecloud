

import httpLambda from 'http-lambda';

import {
  Env
} from './types-core';

import {
  MinLog
} from 'minlog';


export interface LambdaLoggerExtensions {
  _canTrace: boolean;
  level: () => string;
}

export type LambdaLogger = InstanceType<MinLog> & LambdaLoggerExtensions;

export interface LambdaContextExtensions {
  env: Env;
  // amendment from src/lambda/logger.ts
  log: LambdaLogger;
}

export type LambdaEvent = any; // JsonObject;

export type LambdaResult = any; // JsonObject;

export type LambdaContext = httpLambda.ServerResponse['ctx'] & LambdaContextExtensions;

export type LambdaHandler<TEvent extends LambdaEvent, TResult extends LambdaResult> = (
  event: TEvent,
  context: LambdaContext
) => Promise<TResult>;
