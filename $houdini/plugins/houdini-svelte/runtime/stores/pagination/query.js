import { derived } from "svelte/store";
import { getClient, initClient } from "../../client";
import { QueryStore } from "../query";
import { cursorHandlers } from "./cursor";
import { offsetHandlers } from "./offset";
import { extractPageInfo } from "./pageInfo";
class QueryStoreCursor extends QueryStore {
  paginated = true;
  constructor(config) {
    super(config);
  }
  #_handlers = null;
  get #handlers() {
    if (this.#_handlers) {
      return this.#_handlers;
    }
    const paginationObserver = getClient().observe({
      artifact: this.artifact
    });
    this.#_handlers = cursorHandlers({
      artifact: this.artifact,
      observer: this.observer,
      storeName: this.name,
      fetch: super.fetch.bind(this),
      fetchUpdate: async (args, updates) => {
        await initClient();
        return paginationObserver.send({
          ...args,
          variables: {
            ...args?.variables
          },
          cacheParams: {
            applyUpdates: updates
          }
        });
      }
    });
    return this.#_handlers;
  }
  async fetch(args) {
    return this.#handlers.fetch.call(this, args);
  }
  async loadPreviousPage(args) {
    return this.#handlers.loadPreviousPage(args);
  }
  async loadNextPage(args) {
    return this.#handlers.loadNextPage(args);
  }
  subscribe(run, invalidate) {
    const combined = derived([{ subscribe: super.subscribe.bind(this) }], ([$parent]) => {
      return {
        ...$parent,
        pageInfo: extractPageInfo($parent.data, this.artifact.refetch.path)
      };
    });
    return combined.subscribe(run, invalidate);
  }
}
class QueryStoreOffset extends QueryStore {
  paginated = true;
  async loadNextPage(args) {
    return this.#handlers.loadNextPage.call(this, args);
  }
  fetch(args) {
    return this.#handlers.fetch.call(this, args);
  }
  #_handlers = null;
  get #handlers() {
    if (this.#_handlers) {
      return this.#_handlers;
    }
    const paginationObserver = getClient().observe({
      artifact: this.artifact
    });
    this.#_handlers = offsetHandlers({
      artifact: this.artifact,
      observer: this.observer,
      storeName: this.name,
      fetch: super.fetch,
      fetchUpdate: async (args) => {
        await initClient();
        return paginationObserver.send({
          ...args,
          variables: {
            ...args?.variables
          },
          cacheParams: {
            applyUpdates: ["append"]
          }
        });
      }
    });
    return this.#_handlers;
  }
}
export {
  QueryStoreCursor,
  QueryStoreOffset
};
