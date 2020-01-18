/// <reference types="node" />
import { ExpressLambdaRequest } from '../types';
import { JsonValue } from 'lodash-firecloud/types';
import { URL } from 'url';
export declare let getSelfUrl: (this: ExpressLambdaRequest) => URL;
export declare let getPaginationUrl: (this: ExpressLambdaRequest, { perPage, ref }: {
    perPage: number;
    ref: string;
}) => URL;
export declare let getBody: (this: ExpressLambdaRequest) => JsonValue;
