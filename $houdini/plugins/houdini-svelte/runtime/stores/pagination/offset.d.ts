import type { DocumentStore } from '$houdini/runtime/client';
import type { SendParams } from '$houdini/runtime/client/documentStore';
import type { GraphQLObject, QueryArtifact, QueryResult } from '$houdini/runtime/lib/types';
import type { QueryStoreFetchParams } from '../query';
import type { FetchFn } from './fetch';
export declare function offsetHandlers<_Data extends GraphQLObject, _Input extends {}>({ artifact, observer, fetch, fetchUpdate, storeName, }: {
    artifact: QueryArtifact;
    fetch: FetchFn<_Data, _Input>;
    fetchUpdate: (arg: SendParams) => ReturnType<FetchFn<_Data, _Input>>;
    storeName: string;
    observer: DocumentStore<_Data, _Input>;
}): {
    loadNextPage: ({ limit, offset, fetch, metadata, }?: {
        limit?: number | undefined;
        offset?: number | undefined;
        fetch?: typeof globalThis.fetch | undefined;
        metadata?: {} | undefined;
    }) => Promise<void>;
    fetch(args?: QueryStoreFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
};
