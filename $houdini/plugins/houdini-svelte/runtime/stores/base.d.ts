import { DocumentStore, type ObserveParams } from '$houdini/runtime/client';
import type { GraphQLObject, DocumentArtifact, QueryResult } from '$houdini/runtime/lib/types';
import type { Readable } from 'svelte/store';
export declare class BaseStore<_Data extends GraphQLObject, _Input extends {}, _Artifact extends DocumentArtifact = DocumentArtifact> {
    #private;
    get artifact(): _Artifact;
    get name(): string;
    constructor(params: ObserveParams<_Data, _Artifact>);
    protected get observer(): DocumentStore<_Data, _Input>;
    subscribe(...args: Parameters<Readable<QueryResult<_Data, _Input>>['subscribe']>): () => void;
    setup(init?: boolean): void;
}
