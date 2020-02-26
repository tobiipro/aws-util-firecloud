import express from 'express';
import { ExpressLambdaRequest, ExpressLambdaResponse } from '../types';
export declare let applyMixins: () => (req: ExpressLambdaRequest, res: ExpressLambdaResponse, next: express.NextFunction) => void;
export declare let xForward: () => (req: ExpressLambdaRequest, _res: ExpressLambdaResponse, next: express.NextFunction) => void;
export declare let handleResponseError: () => (err: Error, _req: ExpressLambdaRequest, res: ExpressLambdaResponse, _next: express.NextFunction) => Promise<void>;
