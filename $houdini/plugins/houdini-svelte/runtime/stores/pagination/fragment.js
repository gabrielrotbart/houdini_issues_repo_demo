import { getCurrentConfig, keyFieldsForType } from "$houdini/runtime/lib/config";
import { siteURL } from "$houdini/runtime/lib/constants";
import { CompiledFragmentKind } from "$houdini/runtime/lib/types";
import { derived, get } from "svelte/store";
import { getClient, initClient } from "../../client";
import { cursorHandlers } from "./cursor";
import { offsetHandlers } from "./offset";
import { extractPageInfo } from "./pageInfo";
class BasePaginatedFragmentStore {
  paginated = true;
  paginationArtifact;
  name;
  kind = CompiledFragmentKind;
  constructor(config) {
    this.paginationArtifact = config.paginationArtifact;
    this.name = config.storeName;
  }
  queryVariables(store) {
    const config = getCurrentConfig();
    const { targetType } = this.paginationArtifact.refetch || {};
    const typeConfig = config.types?.[targetType || ""];
    if (!typeConfig) {
      throw new Error(
        `Missing type refetch configuration for ${targetType}. For more information, see ${siteURL}/guides/pagination#paginated-fragments`
      );
    }
    let idVariables = {};
    const value = get(store).data;
    if (typeConfig.resolve?.arguments) {
      idVariables = typeConfig.resolve.arguments?.(value) || {};
    } else {
      const keys = keyFieldsForType(config, targetType || "");
      idVariables = Object.fromEntries(keys.map((key) => [key, value[key]]));
    }
    return {
      ...idVariables
    };
  }
}
class FragmentStoreCursor extends BasePaginatedFragmentStore {
  get(initialValue) {
    const store = getClient().observe({
      artifact: this.paginationArtifact,
      initialValue: initialValue ?? null
    });
    const handlers = this.storeHandlers(store);
    const subscribe = (run, invalidate) => {
      const combined = derived(
        [store],
        ([$parent]) => ({
          ...$parent,
          pageInfo: extractPageInfo(
            $parent.data,
            this.paginationArtifact.refetch.path
          )
        })
      );
      return combined.subscribe(run, invalidate);
    };
    return {
      kind: CompiledFragmentKind,
      data: derived(store, ($value) => $value.data),
      subscribe,
      fetching: derived(store, ($store) => $store.fetching),
      fetch: handlers.fetch,
      pageInfo: handlers.pageInfo,
      loadNextPage: handlers.loadNextPage,
      loadPreviousPage: handlers.loadPreviousPage
    };
  }
  storeHandlers(observer) {
    return cursorHandlers({
      artifact: this.paginationArtifact,
      fetchUpdate: async (args, updates) => {
        await initClient();
        return observer.send({
          ...args,
          variables: {
            ...args?.variables,
            ...this.queryVariables(observer)
          },
          cacheParams: {
            applyUpdates: updates
          }
        });
      },
      fetch: async (args) => {
        await initClient();
        return await observer.send({
          ...args,
          variables: {
            ...args?.variables,
            ...this.queryVariables(observer)
          }
        });
      },
      observer,
      storeName: this.name
    });
  }
}
class FragmentStoreOffset extends BasePaginatedFragmentStore {
  get(initialValue) {
    const observer = getClient().observe({
      artifact: this.paginationArtifact,
      initialValue
    });
    const handlers = offsetHandlers({
      artifact: this.paginationArtifact,
      fetch: async (args) => {
        return observer.send({
          ...args,
          variables: {
            ...this.queryVariables(observer),
            ...args?.variables
          }
        });
      },
      fetchUpdate: async (args) => {
        return observer.send({
          ...args,
          variables: {
            ...this.queryVariables(observer),
            ...args?.variables
          },
          cacheParams: {
            applyUpdates: ["append"]
          }
        });
      },
      observer,
      storeName: this.name
    });
    return {
      kind: CompiledFragmentKind,
      data: derived(observer, ($value) => $value.data),
      subscribe: observer.subscribe.bind(observer),
      fetch: handlers.fetch,
      loadNextPage: handlers.loadNextPage,
      fetching: derived(observer, ($store) => $store.fetching)
    };
  }
}
export {
  FragmentStoreCursor,
  FragmentStoreOffset
};
