import type { FetchContext } from '$houdini/runtime/client/plugins/fetch';
import type { GraphQLObject, HoudiniFetchContext, MutationArtifact, QueryArtifact, QueryResult, CachePolicies } from '$houdini/runtime/lib/types';
import type { LoadEvent, RequestEvent } from '@sveltejs/kit';
import type { PluginArtifactData } from '../../plugin/artifactData';
import { BaseStore } from './base';
export declare class QueryStore<_Data extends GraphQLObject, _Input extends {}> extends BaseStore<_Data, _Input, QueryArtifact> {
    variables: boolean;
    kind: "HoudiniQuery";
    protected loadPending: boolean;
    protected storeName: string;
    constructor({ artifact, storeName, variables }: StoreConfig<_Data, _Input, QueryArtifact>);
    /**
     * Fetch the data from the server
     */
    fetch(params?: RequestEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: LoadEventFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: ClientFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
    fetch(params?: QueryStoreFetchParams<_Data, _Input>): Promise<QueryResult<_Data, _Input>>;
}
export type StoreConfig<_Data extends GraphQLObject, _Input, _Artifact> = {
    artifact: _Artifact & {
        pluginData: {
            'houdini-svelte': PluginArtifactData;
        };
    };
    storeName: string;
    variables: boolean;
};
export declare function fetchParams<_Data extends GraphQLObject, _Input>(artifact: QueryArtifact | MutationArtifact, storeName: string, params?: QueryStoreFetchParams<_Data, _Input>): Promise<{
    context: FetchContext;
    policy: CachePolicies | undefined;
    params: QueryStoreFetchParams<_Data, _Input>;
}>;
type FetchGlobalParams<_Data extends GraphQLObject, _Input> = {
    variables?: _Input;
    /**
     * The policy to use when performing the fetch. If set to CachePolicy.NetworkOnly,
     * a request will always be sent, even if the variables are the same as the last call
     * to fetch.
     */
    policy?: CachePolicies;
    /**
     * An object that will be passed to the fetch function.
     * You can do what you want with it!
     */
    metadata?: App.Metadata;
    /**
     * Set to true if you want the promise to pause while it's resolving.
     * Only enable this if you know what you are doing. This will cause route
     * transitions to pause while loading data.
     */
    blocking?: boolean;
    /**
     * A function to call after the fetch happens (whether fake or not)
     */
    then?: (val: _Data | null) => void | Promise<void>;
};
export type LoadEventFetchParams<_Data extends GraphQLObject, _Input> = FetchGlobalParams<_Data, _Input> & {
    /**
     * Directly the `even` param coming from the `load` function
     */
    event?: LoadEvent;
};
export type RequestEventFetchParams<_Data extends GraphQLObject, _Input> = FetchGlobalParams<_Data, _Input> & {
    /**
     * A RequestEvent should be provided when the store is being used in an endpoint.
     * When this happens, fetch also needs to be provided
     */
    event?: RequestEvent;
    /**
     * The fetch function to use when using this store in an endpoint.
     */
    fetch?: LoadEvent['fetch'];
};
export type ClientFetchParams<_Data extends GraphQLObject, _Input> = FetchGlobalParams<_Data, _Input> & {
    /**
     * An object containing all of the current info necessary for a
     * client-side fetch. Must be called in component initialization with
     * something like this: `const context = getHoudiniFetchContext()`
     */
    context?: HoudiniFetchContext;
};
export type QueryStoreFetchParams<_Data extends GraphQLObject, _Input> = QueryStoreLoadParams<_Data, _Input> | ClientFetchParams<_Data, _Input>;
export type QueryStoreLoadParams<_Data extends GraphQLObject, _Input> = LoadEventFetchParams<_Data, _Input> | RequestEventFetchParams<_Data, _Input>;
export {};
