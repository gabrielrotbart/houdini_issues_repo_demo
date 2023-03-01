import type { SubscriptionArtifact } from '$houdini/runtime/lib/types';
import type { GraphQLObject } from 'houdini';
import { BaseStore } from './base';
export declare class SubscriptionStore<_Data extends GraphQLObject, _Input extends {}> extends BaseStore<_Data, _Input, SubscriptionArtifact> {
    kind: "HoudiniSubscription";
    constructor({ artifact }: {
        artifact: SubscriptionArtifact;
    });
    listen(variables?: _Input, args?: {
        metadata: App.Metadata;
    }): Promise<void>;
    unlisten(): Promise<void>;
}
