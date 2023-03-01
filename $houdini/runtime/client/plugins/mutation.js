import cache from "../../cache";
import { marshalSelection } from "../../lib/scalars";
import { ArtifactKind } from "../../lib/types";
import { documentPlugin } from "../utils";
const mutation = documentPlugin(ArtifactKind.Mutation, () => {
  return {
    async start(ctx, { next, marshalVariables }) {
      const layer = cache._internal_unstable.storage.createLayer(true);
      const optimisticResponse = ctx.stuff.optimisticResponse;
      let toNotify = [];
      if (optimisticResponse) {
        toNotify = cache.write({
          selection: ctx.artifact.selection,
          data: await marshalSelection({
            selection: ctx.artifact.selection,
            data: optimisticResponse
          }),
          variables: marshalVariables(ctx),
          layer: layer.id
        });
      }
      ctx.cacheParams = {
        ...ctx.cacheParams,
        layer,
        notifySubscribers: toNotify,
        forceNotify: true
      };
      next(ctx);
    },
    afterNetwork(ctx, { resolve }) {
      ctx.cacheParams?.layer?.clear();
      resolve(ctx);
    },
    end(ctx, { resolve, value }) {
      const hasErrors = value.errors && value.errors.length > 0;
      if (hasErrors) {
        ctx.cacheParams?.layer?.clear();
      }
      if (ctx.cacheParams?.layer) {
        cache._internal_unstable.storage.resolveLayer(ctx.cacheParams.layer.id);
      }
      resolve(ctx);
    },
    catch(ctx, { error }) {
      if (ctx.cacheParams?.layer) {
        const { layer } = ctx.cacheParams;
        layer.clear();
        cache._internal_unstable.storage.resolveLayer(layer.id);
      }
      throw error;
    }
  };
});
export {
  mutation
};
