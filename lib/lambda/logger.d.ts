import { LambdaContext } from '../types';
import { MinLog } from 'minlog';
declare module 'aws-sdk/lib/config' {
    interface Logger {
        isTTY?: boolean;
    }
}
export declare let setup: ({ ctx }: {
    ctx: LambdaContext;
}) => MinLog;
