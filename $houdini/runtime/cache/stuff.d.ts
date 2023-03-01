import type { GraphQLValue } from '../lib/types';
export declare function evaluateKey(key: string, variables?: {
    [key: string]: GraphQLValue;
}): string;
