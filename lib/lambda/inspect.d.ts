/// <reference types="node" />
import os from 'os';
import { LambdaContext } from '../types';
import { JsonValue } from 'lodash-firecloud/types';
declare type Inspection = {
    process: {
        [TKey in keyof NodeJS.Process]: JsonValue;
    };
    os: Partial<typeof os>;
    cpuUsageDiff: Partial<NodeJS.Process['cpuUsage']>;
    memoryUsageDiff: Partial<NodeJS.Process['memoryUsage']>;
};
export declare let inspect: (({ ctx }: {
    ctx: LambdaContext;
}) => Promise<void>) & {
    previousInspection: Inspection;
};
export default inspect;
