import type { Record } from "./public/record";

export declare type CacheTypeDef = {
    types: {
        Entry: {
            idFields: {
                id: string;
            };
            fields: {
                description: {
                    type: string;
                    args: never;
                };
                id: {
                    type: string;
                    args: never;
                };
                name: {
                    type: string;
                    args: never;
                };
            };
            fragments: [];
        };
        __ROOT__: {
            idFields: {};
            fields: {
                entries: {
                    type: (Record<CacheTypeDef, "Entry">)[];
                    args: never;
                };
            };
            fragments: [];
        };
    };
    lists: {};
    queries: [];
};