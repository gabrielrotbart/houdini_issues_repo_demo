import { CachePolicy } from "$houdini/runtime/lib";
import { deepEquals } from "$houdini/runtime/lib/deepEquals";
import { get } from "svelte/store";
import { getSession } from "../../session";
import { fetchParams } from "../query";
import { countPage, missingPageSizeError } from "./pageInfo";
function offsetHandlers({
  artifact,
  observer,
  fetch,
  fetchUpdate,
  storeName
}) {
  const getValue = () => get(observer);
  let getOffset = () => artifact.refetch?.start || countPage(artifact.refetch.path, getValue().data) || artifact.refetch.pageSize;
  let currentOffset = getOffset() ?? 0;
  return {
    loadNextPage: async ({
      limit,
      offset,
      fetch: fetch2,
      metadata
    } = {}) => {
      const queryVariables = {
        ...getValue().variables,
        offset: offset ?? getOffset()
      };
      if (limit || limit === 0) {
        queryVariables.limit = limit;
      }
      if (!queryVariables.limit && !artifact.refetch.pageSize) {
        throw missingPageSizeError("loadNextPage");
      }
      await fetchUpdate({
        variables: queryVariables,
        fetch: fetch2,
        metadata,
        policy: CachePolicy.NetworkOnly,
        session: await getSession()
      });
      const pageSize = queryVariables.limit || artifact.refetch.pageSize;
      currentOffset = offset + pageSize;
    },
    async fetch(args) {
      const { params } = await fetchParams(artifact, storeName, args);
      const { variables } = params ?? {};
      if (variables && !deepEquals(getValue().variables, variables)) {
        return fetch.call(this, params);
      }
      const count = currentOffset || getOffset();
      const queryVariables = {};
      if (!artifact.refetch.pageSize || count > artifact.refetch.pageSize) {
        queryVariables.limit = count;
      }
      return await fetch.call(this, {
        ...params,
        variables: queryVariables
      });
    }
  };
}
export {
  offsetHandlers
};
