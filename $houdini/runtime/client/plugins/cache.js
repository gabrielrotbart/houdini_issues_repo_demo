import cache from "../../cache";
import { ArtifactKind, CachePolicy, DataSource } from "../../lib/types";
const cachePolicy = ({
  enabled,
  setFetching,
  cache: localCache = cache
}) => () => {
  return {
    network(ctx, { initialValue, next, resolve, marshalVariables }) {
      const { policy, artifact } = ctx;
      let useCache = false;
      if (enabled && artifact.kind === ArtifactKind.Query && !ctx.cacheParams?.disableRead) {
        if (policy !== CachePolicy.NetworkOnly) {
          const value = localCache.read({
            selection: artifact.selection,
            variables: marshalVariables(ctx)
          });
          const allowed = !value.partial || artifact.kind === ArtifactKind.Query && artifact.partial;
          if (policy === CachePolicy.CacheOnly) {
            return resolve(ctx, {
              fetching: false,
              variables: ctx.variables ?? null,
              data: allowed ? value.data : initialValue.data,
              errors: null,
              source: DataSource.Cache,
              partial: allowed ? value.partial : false,
              stale: value.stale
            });
          }
          useCache = !!(value.data !== null && allowed);
          if (useCache) {
            resolve(ctx, {
              fetching: false,
              variables: ctx.variables ?? null,
              data: value.data,
              errors: null,
              source: DataSource.Cache,
              partial: value.partial,
              stale: value.stale
            });
          }
          if (useCache && !value.partial && !value.stale && ctx.policy !== "CacheAndNetwork") {
            return;
          }
        }
      }
      if (enabled) {
        setTimeout(() => {
          localCache._internal_unstable.collectGarbage();
        }, 0);
      }
      setFetching(!useCache);
      return next(ctx);
    },
    afterNetwork(ctx, { resolve, value, marshalVariables }) {
      if (value.source !== DataSource.Cache && enabled && value.data && !ctx.cacheParams?.disableWrite) {
        localCache.write({
          ...ctx.cacheParams,
          layer: ctx.cacheParams?.layer?.id,
          selection: ctx.artifact.selection,
          data: value.data,
          variables: marshalVariables(ctx)
        });
      }
      resolve(ctx, value);
    }
  };
};
export {
  cachePolicy
};
