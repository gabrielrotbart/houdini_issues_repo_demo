import { CompiledFragmentKind } from "$houdini/runtime/lib/types";
import { writable } from "svelte/store";
class FragmentStore {
  artifact;
  name;
  kind = CompiledFragmentKind;
  context = null;
  constructor({ artifact, storeName }) {
    this.artifact = artifact;
    this.name = storeName;
  }
  get(initialValue) {
    let store = writable(initialValue);
    return {
      kind: CompiledFragmentKind,
      subscribe: (...args) => {
        return store.subscribe(...args);
      },
      update: (val) => store?.set(val)
    };
  }
}
export {
  FragmentStore
};
