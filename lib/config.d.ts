import aws from 'aws-sdk';
import { Env } from './types';
export declare let get: ({ env }: {
    env: Env;
}) => Partial<aws.Config>;
export declare let current: Partial<aws.Config>;
