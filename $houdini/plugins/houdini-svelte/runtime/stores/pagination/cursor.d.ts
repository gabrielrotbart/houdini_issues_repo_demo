import type { DocumentStore } from '$houdini/runtime/client';
import type { SendParams } from '$houdini/runtime/client/documentStore';
import type { GraphQLObject, QueryArtifact } from '$houdini/runtime/lib/types';
import type { CursorHandlers } from '../../types';
import type { FetchFn } from './fetch';
export declare function cursorHandlers<_Data extends GraphQLObject, _Input extends Record<string, any>>({ artifact, storeName, observer, fetchUpdate: parentFetchUpdate, fetch: parentFetch, }: {
    artifact: QueryArtifact;
    storeName: string;
    observer: DocumentStore<_Data, _Input>;
    fetch: FetchFn<_Data, _Input>;
    fetchUpdate: (arg: SendParams, updates: string[]) => ReturnType<FetchFn<_Data, _Input>>;
}): CursorHandlers<_Data, _Input>;
