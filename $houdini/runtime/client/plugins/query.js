import cache from "../../cache";
import { ArtifactKind, DataSource } from "../../lib/types";
import { documentPlugin } from "../utils";
const query = documentPlugin(ArtifactKind.Query, function() {
  let subscriptionSpec = null;
  let lastVariables = null;
  let artifactName = "";
  return {
    start(ctx, { next }) {
      ctx.variables = {
        ...lastVariables,
        ...ctx.variables
      };
      next(ctx);
    },
    end(ctx, { resolve, marshalVariables, variablesChanged }) {
      if (variablesChanged(ctx)) {
        artifactName = ctx.artifact.name;
        if (subscriptionSpec) {
          cache.unsubscribe(subscriptionSpec, subscriptionSpec.variables?.() || {});
        }
        lastVariables = { ...marshalVariables(ctx) };
        subscriptionSpec = {
          rootType: ctx.artifact.rootType,
          selection: ctx.artifact.selection,
          variables: () => lastVariables,
          set: (newValue) => {
            resolve(ctx, {
              data: newValue,
              errors: null,
              fetching: false,
              partial: false,
              stale: false,
              source: DataSource.Cache,
              variables: ctx.variables ?? {}
            });
          }
        };
        cache.subscribe(subscriptionSpec, lastVariables ?? {});
      }
      resolve(ctx);
    },
    cleanup() {
      if (subscriptionSpec) {
        cache.unsubscribe(subscriptionSpec, subscriptionSpec.variables?.() ?? {});
        lastVariables = null;
      }
    }
  };
});
export {
  query
};
