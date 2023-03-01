import type { ConfigFile } from '../lib/config';
import type { GraphQLObject, GraphQLValue, NestedList, SubscriptionSelection, SubscriptionSpec } from '../lib/types';
import { GarbageCollector } from './gc';
import type { ListCollection } from './lists';
import { ListManager } from './lists';
import { SchemaManager } from './schema';
import { StaleManager } from './staleManager';
import type { Layer, LayerID } from './storage';
import { InMemoryStorage } from './storage';
import { InMemorySubscriptions, type FieldSelection } from './subscription';
export declare class Cache {
    _internal_unstable: CacheInternal;
    constructor(config?: ConfigFile);
    write({ layer: layerID, notifySubscribers, ...args }: {
        data: {
            [key: string]: GraphQLValue;
        };
        selection: SubscriptionSelection;
        variables?: {};
        parent?: string;
        layer?: LayerID | null;
        applyUpdates?: string[];
        notifySubscribers?: SubscriptionSpec[];
        forceNotify?: boolean;
        forceStale?: boolean;
    }): SubscriptionSpec[];
    read(...args: Parameters<CacheInternal['getSelection']>): {
        data: GraphQLObject | null;
        partial: boolean;
        stale: boolean;
    };
    subscribe(spec: SubscriptionSpec, variables?: {}): void;
    unsubscribe(spec: SubscriptionSpec, variables?: {}): void;
    list(name: string, parentID?: string, allLists?: boolean): ListCollection;
    delete(id: string): void;
    setConfig(config: ConfigFile): void;
    markTypeStale(options?: {
        type: string;
        field?: string;
        when?: {};
    }): void;
    markRecordStale(id: string, options: {
        field?: string;
        when?: {};
    }): void;
    getFieldTime(id: string, field: string): number | null | undefined;
}
declare class CacheInternal {
    private _disabled;
    config: ConfigFile;
    storage: InMemoryStorage;
    subscriptions: InMemorySubscriptions;
    lists: ListManager;
    cache: Cache;
    lifetimes: GarbageCollector;
    staleManager: StaleManager;
    schema: SchemaManager;
    constructor({ storage, subscriptions, lists, cache, lifetimes, staleManager, schema, }: {
        storage: InMemoryStorage;
        subscriptions: InMemorySubscriptions;
        lists: ListManager;
        cache: Cache;
        lifetimes: GarbageCollector;
        staleManager: StaleManager;
        schema: SchemaManager;
    });
    setConfig(config: ConfigFile): void;
    writeSelection({ data, selection, variables, parent, applyUpdates, layer, toNotify, forceNotify, forceStale, }: {
        data: {
            [key: string]: GraphQLValue;
        };
        selection: SubscriptionSelection;
        variables?: {
            [key: string]: GraphQLValue;
        };
        parent?: string;
        root?: string;
        layer: Layer;
        toNotify?: FieldSelection[];
        applyUpdates?: string[];
        forceNotify?: boolean;
        forceStale?: boolean;
    }): FieldSelection[];
    getSelection({ selection, parent, variables, stepsFromConnection, }: {
        selection: SubscriptionSelection;
        parent?: string;
        variables?: {};
        stepsFromConnection?: number | null;
    }): {
        data: GraphQLObject | null;
        partial: boolean;
        stale: boolean;
        hasData: boolean;
    };
    id(type: string, data: {} | null): string | null;
    id(type: string, id: string): string | null;
    idFields(type: string): string[];
    computeID(type: string, data: any): string;
    hydrateNestedList({ fields, variables, linkedList, stepsFromConnection, }: {
        fields: SubscriptionSelection;
        variables?: {};
        linkedList: NestedList;
        stepsFromConnection: number | null;
    }): {
        data: NestedList<GraphQLValue>;
        partial: boolean;
        stale: boolean;
        hasData: boolean;
    };
    extractNestedListIDs({ value, abstract, recordID, key, linkedType, fields, variables, applyUpdates, specs, layer, forceNotify, }: {
        value: GraphQLValue[];
        recordID: string;
        key: string;
        linkedType: string;
        abstract: boolean;
        variables: {};
        specs: FieldSelection[];
        applyUpdates?: string[];
        fields: SubscriptionSelection;
        layer: Layer;
        forceNotify?: boolean;
    }): {
        nestedIDs: NestedList;
        newIDs: (string | null)[];
    };
    collectGarbage(): void;
}
export declare const rootID = "_ROOT_";
export {};
