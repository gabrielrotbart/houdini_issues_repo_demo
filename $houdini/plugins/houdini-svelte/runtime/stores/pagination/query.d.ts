import type { GraphQLObject, QueryArtifact, QueryResult } from '$houdini/runtime/lib/types';
import type { Subscriber } from 'svelte/store';
import type { CursorHandlers, OffsetHandlers } from '../../types';
import type { ClientFetchParams, LoadEventFetchParams, QueryStoreFetchParams, RequestEventFetchParams, StoreConfig } from '../query';
import { QueryStore } from '../query';
import { type PageInfo } from './pageInfo';
export type CursorStoreResult<_Data extends GraphQLObject, _Input extends {}> = QueryResult<_Data, _Input> & {
    pageInfo: PageInfo;
};
export declare class QueryStoreCursor<_Data extends GraphQLObject, _Input extends {}> extends QueryStore<_Data, _Input> {
    #private;
    paginated: boolean;
    constructor(config: StoreConfig<_Data, _Input, QueryArtifact>);
    fetch(params?: RequestEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: LoadEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: ClientFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: QueryStoreFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    loadPreviousPage(args?: Parameters<Required<CursorHandlers<_Data, _Input>>['loadPreviousPage']>[0]): Promise<void>;
    loadNextPage(args?: Parameters<CursorHandlers<_Data, _Input>['loadNextPage']>[0]): Promise<void>;
    subscribe(run: Subscriber<CursorStoreResult<_Data, _Input>>, invalidate?: ((value?: CursorStoreResult<_Data, _Input> | undefined) => void) | undefined): () => void;
}
export declare class QueryStoreOffset<_Data extends GraphQLObject, _Input extends {}> extends QueryStore<_Data, _Input> {
    #private;
    paginated: boolean;
    loadNextPage(args?: Parameters<OffsetHandlers<_Data, _Input>['loadNextPage']>[0]): Promise<void>;
    fetch(params?: RequestEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: LoadEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: ClientFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: QueryStoreFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
}
