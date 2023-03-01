import cache from '../../cache';
import type { Cache } from '../../cache/cache';
import type { ClientPlugin } from '../documentStore';
export declare const cachePolicy: ({ enabled, setFetching, cache: localCache, }: {
    enabled: boolean;
    setFetching: (val: boolean) => void;
    cache?: Cache | undefined;
}) => ClientPlugin;
