import type { QueryResult } from '../../lib';
import type { ClientPlugin } from '../documentStore';
export type ThrowOnErrorParams = {
    operations: ('all' | 'query' | 'mutation' | 'subscription')[];
    error?: (errors: NonNullable<QueryResult<any, any>['errors']>) => unknown;
};
export declare const throwOnError: ({ operations, error }: ThrowOnErrorParams) => ClientPlugin;
