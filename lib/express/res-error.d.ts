import { JsonObject } from 'lodash-firecloud/types';
export declare class ResponseError extends Error {
    code: number;
    contentType: string;
    body: JsonObject;
    constructor(status: number, extensions?: {});
}
export default ResponseError;
