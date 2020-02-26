import { LambdaContext, PackageJson } from '../types';
export declare let merge: ({ e, ctx, pkg }: {
    e: any;
    ctx: LambdaContext;
    pkg: PackageJson;
}) => Promise<void>;
