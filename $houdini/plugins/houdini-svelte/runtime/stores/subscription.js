import { CompiledSubscriptionKind } from "$houdini/runtime/lib/types";
import { initClient } from "../client";
import { getSession } from "../session";
import { BaseStore } from "./base";
class SubscriptionStore extends BaseStore {
  kind = CompiledSubscriptionKind;
  constructor({ artifact }) {
    super({ artifact });
  }
  async listen(variables, args) {
    await initClient();
    this.observer.send({
      variables,
      session: await getSession(),
      metadata: args?.metadata
    });
  }
  async unlisten() {
    await initClient();
    await this.observer.cleanup();
  }
}
export {
  SubscriptionStore
};
