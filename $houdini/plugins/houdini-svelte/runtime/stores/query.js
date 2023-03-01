import * as log from "$houdini/runtime/lib/log";
import { ArtifactKind, CachePolicy, CompiledQueryKind } from "$houdini/runtime/lib/types";
import { get } from "svelte/store";
import { clientStarted, isBrowser } from "../adapter";
import { initClient } from "../client";
import { getSession } from "../session";
import { BaseStore } from "./base";
class QueryStore extends BaseStore {
  variables;
  kind = CompiledQueryKind;
  loadPending = false;
  storeName;
  constructor({ artifact, storeName, variables }) {
    const fetching = artifact.pluginData?.["houdini-svelte"].isManualLoad !== true;
    super({ artifact, fetching });
    this.storeName = storeName;
    this.variables = variables;
  }
  async fetch(args) {
    await initClient();
    this.setup();
    const { policy, params, context } = await fetchParams(this.artifact, this.storeName, args);
    if (!isBrowser && !(params && "fetch" in params) && (!params || !("event" in params))) {
      log.error(contextError(this.storeName));
      throw new Error("Error, check above logs for help.");
    }
    const isLoadFetch = Boolean("event" in params && params.event);
    const isComponentFetch = !isLoadFetch;
    if (this.loadPending && isComponentFetch) {
      log.error(`\u26A0\uFE0F Encountered fetch from your component while ${this.storeName}.load was running.
This will result in duplicate queries. If you are trying to ensure there is always a good value, please a CachePolicy instead.`);
      return get(this.observer);
    }
    if (isComponentFetch) {
      params.blocking = true;
    }
    if (isLoadFetch) {
      this.loadPending = true;
    }
    const fakeAwait = clientStarted && isBrowser && !params?.blocking;
    if (policy !== CachePolicy.NetworkOnly && fakeAwait) {
      await this.observer.send({
        fetch: context.fetch,
        variables: params.variables,
        metadata: params.metadata,
        session: context.session,
        policy: CachePolicy.CacheOnly,
        silenceEcho: true
      });
    }
    const request = this.observer.send({
      fetch: context.fetch,
      variables: params.variables,
      metadata: params.metadata,
      session: context.session,
      policy,
      stuff: {}
    });
    request.then((val) => {
      this.loadPending = false;
      params.then?.(val.data);
    }).catch(() => {
    });
    if (!fakeAwait) {
      await request;
    }
    return get(this.observer);
  }
}
async function fetchParams(artifact, storeName, params) {
  let policy = params?.policy;
  if (!policy && artifact.kind === ArtifactKind.Query) {
    policy = artifact.policy ?? CachePolicy.CacheOrNetwork;
  }
  let fetchFn = null;
  if (params) {
    if ("fetch" in params && params.fetch) {
      fetchFn = params.fetch;
    } else if ("event" in params && params.event && "fetch" in params.event) {
      fetchFn = params.event.fetch;
    }
  }
  if (!fetchFn) {
    fetchFn = globalThis.fetch.bind(globalThis);
  }
  let session = void 0;
  if (params && "event" in params && params.event) {
    session = await getSession(params.event);
  } else if (isBrowser) {
    session = await getSession();
  } else {
    log.error(contextError(storeName));
    throw new Error("Error, check above logs for help.");
  }
  return {
    context: {
      fetch: fetchFn,
      metadata: params?.metadata ?? {},
      session
    },
    policy,
    params: params ?? {}
  };
}
const contextError = (storeName) => `
	${log.red(`Missing event args in load function`)}.

Please remember to pass event to fetch like so:

import type { LoadEvent } from '@sveltejs/kit';

// in a load function...
export async function load(${log.yellow("event")}: LoadEvent) {
	return {
		...load_${storeName}({ ${log.yellow("event")}, variables: { ... } })
	};
}

// in a server-side mutation:
await mutation.mutate({ ... }, ${log.yellow("{ event }")})
`;
export {
  QueryStore,
  fetchParams
};
