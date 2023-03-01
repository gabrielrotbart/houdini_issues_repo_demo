import { CachePolicy } from "$houdini/runtime/lib";
import { getCurrentConfig } from "$houdini/runtime/lib/config";
import { siteURL } from "$houdini/runtime/lib/constants";
import { deepEquals } from "$houdini/runtime/lib/deepEquals";
import { get, writable } from "svelte/store";
import { getSession } from "../../session";
import { fetchParams } from "../query";
import { countPage, extractPageInfo, missingPageSizeError } from "./pageInfo";
function cursorHandlers({
  artifact,
  storeName,
  observer,
  fetchUpdate: parentFetchUpdate,
  fetch: parentFetch
}) {
  const pageInfo = writable(extractPageInfo(get(observer).data, artifact.refetch.path));
  const getState = () => get(observer);
  const loadPage = async ({
    pageSizeVar,
    input,
    functionName,
    metadata = {},
    fetch,
    where
  }) => {
    const config = getCurrentConfig();
    const loadVariables = {
      ...getState().variables,
      ...input
    };
    if (!loadVariables[pageSizeVar] && !artifact.refetch.pageSize) {
      throw missingPageSizeError(functionName);
    }
    const { data } = await parentFetchUpdate(
      {
        variables: loadVariables,
        fetch,
        metadata,
        policy: CachePolicy.NetworkOnly,
        session: await getSession()
      },
      [where === "start" ? "prepend" : "append"]
    );
    const resultPath = [...artifact.refetch.path];
    if (artifact.refetch.embedded) {
      const { targetType } = artifact.refetch;
      if (!config.types?.[targetType]?.resolve) {
        throw new Error(
          `Missing type resolve configuration for ${targetType}. For more information, see ${siteURL}/guides/pagination#paginated-fragments`
        );
      }
      resultPath.unshift(config.types[targetType].resolve.queryField);
    }
    pageInfo.set(extractPageInfo(data, resultPath));
  };
  return {
    loadNextPage: async ({
      first,
      after,
      fetch,
      metadata
    } = {}) => {
      if (artifact.refetch?.direction === "backward") {
        console.warn(`\u26A0\uFE0F ${storeName}.loadNextPage was called but it does not support forwards pagination.
If you think this is an error, please open an issue on GitHub`);
        return;
      }
      const currentPageInfo = extractPageInfo(getState().data, artifact.refetch.path);
      if (!currentPageInfo.hasNextPage) {
        return;
      }
      const input = {
        first: first ?? artifact.refetch.pageSize,
        after: after ?? currentPageInfo.endCursor,
        before: null,
        last: null
      };
      return await loadPage({
        pageSizeVar: "first",
        functionName: "loadNextPage",
        input,
        fetch,
        metadata,
        where: "end"
      });
    },
    loadPreviousPage: async ({
      last,
      before,
      fetch,
      metadata
    } = {}) => {
      if (artifact.refetch?.direction === "forward") {
        console.warn(`\u26A0\uFE0F ${storeName}.loadPreviousPage was called but it does not support backwards pagination.
If you think this is an error, please open an issue on GitHub`);
        return;
      }
      const currentPageInfo = extractPageInfo(getState().data, artifact.refetch.path);
      if (!currentPageInfo.hasPreviousPage) {
        return;
      }
      const input = {
        before: before ?? currentPageInfo.startCursor,
        last: last ?? artifact.refetch.pageSize,
        first: null,
        after: null
      };
      return await loadPage({
        pageSizeVar: "last",
        functionName: "loadPreviousPage",
        input,
        fetch,
        metadata,
        where: "start"
      });
    },
    pageInfo,
    async fetch(args) {
      const { params } = await fetchParams(artifact, storeName, args);
      const { variables } = params ?? {};
      if (variables && !deepEquals(getState().variables, variables)) {
        return await parentFetch(params);
      }
      try {
        var currentPageInfo = extractPageInfo(getState().data, artifact.refetch.path);
      } catch {
        return await parentFetch(params);
      }
      const queryVariables = {};
      const count = countPage(artifact.refetch.path.concat("edges"), getState().data) || artifact.refetch.pageSize;
      if (count && count > artifact.refetch.pageSize) {
        if (currentPageInfo.hasPreviousPage && currentPageInfo.hasNextPage && !(variables?.["first"] && variables?.["after"] || variables?.["last"] && variables?.["before"])) {
          console.warn(`\u26A0\uFE0F Encountered a fetch() in the middle of the connection.
Make sure to pass a cursor value by hand that includes the current set (ie the entry before startCursor)
`);
          return observer.state;
        }
        if (!currentPageInfo.hasPreviousPage) {
          queryVariables["first"] = count;
          queryVariables["after"] = null;
          queryVariables["last"] = null;
          queryVariables["before"] = null;
        } else if (!currentPageInfo.hasNextPage) {
          queryVariables["last"] = count;
          queryVariables["first"] = null;
          queryVariables["after"] = null;
          queryVariables["before"] = null;
        }
      }
      Object.assign(queryVariables, variables ?? {});
      const result = await parentFetch({
        ...params,
        variables: queryVariables
      });
      pageInfo.set(extractPageInfo(result.data, artifact.refetch.path));
      return result;
    }
  };
}
export {
  cursorHandlers
};
