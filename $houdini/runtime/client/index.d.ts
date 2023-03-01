/// <reference path="../../../../../houdini.d.ts" />
import type { DocumentArtifact, GraphQLObject, NestedList } from '../lib/types';
import type { ClientPlugin, ClientHooks } from './documentStore';
import { DocumentStore } from './documentStore';
import { type FetchParamFn, type ThrowOnErrorParams } from './plugins';
export { DocumentStore, type ClientPlugin } from './documentStore';
export { fetch, mutation, query, subscription } from './plugins';
type ConstructorArgs = {
    url: string;
    fetchParams?: FetchParamFn;
    plugins?: NestedList<ClientPlugin>;
    pipeline?: NestedList<ClientPlugin>;
    throwOnError?: ThrowOnErrorParams;
};
export type ObserveParams<_Data extends GraphQLObject, _Artifact extends DocumentArtifact = DocumentArtifact> = {
    artifact: _Artifact;
    cache?: boolean;
    initialValue?: _Data | null;
    fetching?: boolean;
};
export declare class HoudiniClient {
    #private;
    url: string;
    constructor({ url, fetchParams, plugins, pipeline, throwOnError }: ConstructorArgs);
    observe<_Data extends GraphQLObject, _Input extends Record<string, any>>({ artifact, cache, initialValue, fetching, }: ObserveParams<_Data>): DocumentStore<_Data, _Input>;
}
export declare function createPluginHooks(plugins: ClientPlugin[]): ClientHooks[];
