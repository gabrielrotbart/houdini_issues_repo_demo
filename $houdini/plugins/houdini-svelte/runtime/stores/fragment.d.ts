import type { GraphQLObject, FragmentArtifact, HoudiniFetchContext } from '$houdini/runtime/lib/types';
import type { FragmentStoreInstance } from '../types';
export declare class FragmentStore<_Data extends GraphQLObject, _Input = {}> {
    artifact: FragmentArtifact;
    name: string;
    kind: "HoudiniFragment";
    protected context: HoudiniFetchContext | null;
    constructor({ artifact, storeName }: {
        artifact: FragmentArtifact;
        storeName: string;
    });
    get(initialValue: _Data | null): FragmentStoreInstance<_Data | null>;
}
