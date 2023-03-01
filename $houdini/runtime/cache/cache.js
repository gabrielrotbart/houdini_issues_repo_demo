import { computeKey } from "../lib";
import { computeID, defaultConfigValues, keyFieldsForType } from "../lib/config";
import { deepEquals } from "../lib/deepEquals";
import { flatten } from "../lib/flatten";
import { getFieldsForType } from "../lib/selection";
import { GarbageCollector } from "./gc";
import { ListManager } from "./lists";
import { SchemaManager } from "./schema";
import { StaleManager } from "./staleManager";
import { InMemoryStorage } from "./storage";
import { evaluateKey } from "./stuff";
import { InMemorySubscriptions } from "./subscription";
class Cache {
  _internal_unstable;
  constructor(config) {
    this._internal_unstable = new CacheInternal({
      cache: this,
      storage: new InMemoryStorage(),
      subscriptions: new InMemorySubscriptions(this),
      lists: new ListManager(this, rootID),
      lifetimes: new GarbageCollector(this),
      staleManager: new StaleManager(this),
      schema: new SchemaManager(this)
    });
    if (config) {
      this.setConfig(defaultConfigValues(config));
    }
  }
  write({
    layer: layerID,
    notifySubscribers = [],
    ...args
  }) {
    const layer = layerID ? this._internal_unstable.storage.getLayer(layerID) : this._internal_unstable.storage.topLayer;
    const subscribers = this._internal_unstable.writeSelection({ ...args, layer }).map((sub) => sub[0]);
    const notified = [];
    for (const spec of subscribers.concat(notifySubscribers)) {
      if (!notified.includes(spec.set)) {
        notified.push(spec.set);
        spec.set(
          this._internal_unstable.getSelection({
            parent: spec.parentID || rootID,
            selection: spec.selection,
            variables: spec.variables?.() || {}
          }).data
        );
      }
    }
    return subscribers;
  }
  read(...args) {
    const { data, partial, stale, hasData } = this._internal_unstable.getSelection(...args);
    if (!hasData) {
      return { data: null, partial: false, stale: false };
    }
    return {
      data,
      partial,
      stale
    };
  }
  subscribe(spec, variables = {}) {
    return this._internal_unstable.subscriptions.add({
      parent: spec.parentID || rootID,
      spec,
      selection: spec.selection,
      variables
    });
  }
  unsubscribe(spec, variables = {}) {
    return this._internal_unstable.subscriptions.remove(
      spec.parentID || rootID,
      spec.selection,
      [spec],
      variables
    );
  }
  list(name, parentID, allLists) {
    const handler = this._internal_unstable.lists.get(name, parentID, allLists);
    if (!handler) {
      throw new Error(
        `Cannot find list with name: ${name}${parentID ? " under parent " + parentID : ""}. Is it possible that the query is not mounted?`
      );
    }
    return handler;
  }
  delete(id) {
    this._internal_unstable.subscriptions.removeAllSubscribers(id);
    this._internal_unstable.lists.removeIDFromAllLists(id);
    this._internal_unstable.storage.delete(id);
  }
  setConfig(config) {
    this._internal_unstable.setConfig(config);
  }
  markTypeStale(options) {
    if (!options) {
      this._internal_unstable.staleManager.markAllStale();
    } else if (!options.field) {
      this._internal_unstable.staleManager.markTypeStale(options.type);
    } else {
      this._internal_unstable.staleManager.markTypeFieldStale(
        options.type,
        options.field,
        options.when
      );
    }
  }
  markRecordStale(id, options) {
    if (options.field) {
      const key = computeKey({ field: options.field, args: options.when ?? {} });
      this._internal_unstable.staleManager.markFieldStale(id, key);
    } else {
      this._internal_unstable.staleManager.markRecordStale(id);
    }
  }
  getFieldTime(id, field) {
    return this._internal_unstable.staleManager.getFieldTime(id, field);
  }
}
class CacheInternal {
  _disabled = false;
  config = defaultConfigValues({
    plugins: {
      "houdini-svelte": {
        client: ""
      }
    }
  });
  storage;
  subscriptions;
  lists;
  cache;
  lifetimes;
  staleManager;
  schema;
  constructor({
    storage,
    subscriptions,
    lists,
    cache,
    lifetimes,
    staleManager,
    schema
  }) {
    this.storage = storage;
    this.subscriptions = subscriptions;
    this.lists = lists;
    this.cache = cache;
    this.lifetimes = lifetimes;
    this.staleManager = staleManager;
    this.schema = schema;
    this._disabled = typeof globalThis.window === "undefined";
    try {
      if (process.env.HOUDINI_TEST === "true") {
        this._disabled = false;
      }
    } catch {
    }
  }
  setConfig(config) {
    this.config = config;
  }
  writeSelection({
    data,
    selection,
    variables = {},
    parent = rootID,
    applyUpdates,
    layer,
    toNotify = [],
    forceNotify,
    forceStale
  }) {
    if (this._disabled) {
      return [];
    }
    let targetSelection = getFieldsForType(selection, data["__typename"]);
    for (const [field, value] of Object.entries(data)) {
      if (!selection || !targetSelection[field]) {
        continue;
      }
      let {
        type: linkedType,
        keyRaw,
        selection: fieldSelection,
        operations,
        abstract: isAbstract,
        updates,
        nullable
      } = targetSelection[field];
      const key = evaluateKey(keyRaw, variables);
      this.schema.setFieldType({
        parent,
        key: keyRaw,
        type: linkedType,
        nullable,
        link: !!fieldSelection
      });
      const currentSubscribers = this.subscriptions.get(parent, key);
      const specs = currentSubscribers.map((sub) => sub[0]);
      const { value: previousValue, displayLayers } = this.storage.get(parent, key);
      const displayLayer = layer.isDisplayLayer(displayLayers);
      if (displayLayer) {
        this.lifetimes.resetLifetime(parent, key);
        if (forceStale) {
          this.staleManager.markFieldStale(parent, key);
        } else {
          this.staleManager.setFieldTimeToNow(parent, key);
        }
      }
      if (!fieldSelection) {
        let newValue = value;
        if (updates && applyUpdates && Array.isArray(value)) {
          for (const update of applyUpdates) {
            if (!updates.includes(update)) {
              continue;
            }
            if (update === "append") {
              newValue = (previousValue || []).concat(value);
            } else if (update === "prepend") {
              newValue = value.concat(previousValue || []);
            }
          }
        }
        if (updates && applyUpdates?.includes("prepend") && ["endCursor", "hasNextPage"].includes(key)) {
          newValue = previousValue;
        } else if (updates && applyUpdates?.includes("append") && ["startCursor", "hasPreviousPage"].includes(key)) {
          newValue = previousValue;
        }
        const valueChanged = !deepEquals(newValue, previousValue);
        if (displayLayer && (valueChanged || forceNotify)) {
          toNotify.push(...currentSubscribers);
        }
        layer.writeField(parent, key, newValue);
      } else if (value === null) {
        if (previousValue === null) {
          continue;
        }
        const previousLinks = flatten([previousValue]);
        for (const link of previousLinks) {
          this.subscriptions.remove(link, fieldSelection, specs, variables);
        }
        layer.writeLink(parent, key, null);
        toNotify.push(...currentSubscribers);
      } else if (value instanceof Object && !Array.isArray(value)) {
        if (isAbstract) {
          if (!value.__typename) {
            throw new Error(
              "Encountered interface type without __typename in the payload"
            );
          }
          linkedType = value.__typename;
        }
        const embedded = this.idFields(linkedType)?.filter(
          (field2) => typeof value[field2] === "undefined"
        ).length > 0;
        let linkedID = null;
        if (value !== null) {
          linkedID = !embedded ? this.id(linkedType, value) : `${parent}.${key}`;
        }
        let linkChange = linkedID !== previousValue;
        layer.writeLink(parent, key, linkedID);
        if (linkedID && displayLayer && (linkChange || forceNotify)) {
          if (previousValue && typeof previousValue === "string") {
            this.subscriptions.remove(previousValue, fieldSelection, specs, variables);
          }
          this.subscriptions.addMany({
            parent: linkedID,
            subscribers: currentSubscribers,
            variables,
            parentType: linkedType
          });
          toNotify.push(...currentSubscribers);
        }
        if (linkedID) {
          this.writeSelection({
            selection: fieldSelection,
            parent: linkedID,
            data: value,
            variables,
            toNotify,
            applyUpdates,
            layer,
            forceNotify
          });
        }
      } else if (Array.isArray(value) && (typeof previousValue === "undefined" || Array.isArray(previousValue))) {
        let oldIDs = [...previousValue || []];
        const emptyEdges = !updates ? [] : oldIDs.map((id) => {
          if (!id) {
            return "";
          }
          const { value: cursorField } = this.storage.get(id, "cursor");
          if (cursorField) {
            return "";
          }
          const { value: node } = this.storage.get(id, "node");
          if (!node) {
            return "";
          }
          return node;
        });
        let linkedIDs = [];
        const { newIDs, nestedIDs } = this.extractNestedListIDs({
          value,
          abstract: Boolean(isAbstract),
          specs: toNotify,
          applyUpdates,
          recordID: parent,
          key,
          linkedType,
          variables,
          fields: fieldSelection,
          layer,
          forceNotify
        });
        if (applyUpdates && updates) {
          if (key === "edges") {
            const newNodeIDs = [];
            for (const id of newIDs) {
              if (!id) {
                continue;
              }
              const { value: node } = this.storage.get(id, "node");
              if (typeof node !== "string") {
                continue;
              }
              if (!node || !this.storage.get(node, "__typename")) {
                continue;
              }
              newNodeIDs.push(node);
            }
            oldIDs = oldIDs.filter((id) => {
              if (!id) {
                return true;
              }
              const { value: value2 } = this.storage.get(id, "node");
              const node = value2;
              if (newNodeIDs.includes(node) && emptyEdges.includes(node)) {
                return false;
              }
              return true;
            });
          }
          for (const update of applyUpdates) {
            if (update !== "replace" && !updates.includes(update)) {
              continue;
            }
            if (update === "prepend") {
              linkedIDs = newIDs.concat(oldIDs);
            } else if (update === "append") {
              linkedIDs = oldIDs.concat(newIDs);
            } else if (update === "replace") {
              linkedIDs = newIDs;
            }
          }
        } else {
          linkedIDs = nestedIDs;
        }
        const contentChanged = !deepEquals(linkedIDs, oldIDs);
        if (contentChanged || forceNotify) {
          toNotify.push(...currentSubscribers);
        }
        for (const lostID of oldIDs) {
          if (linkedIDs.includes(lostID) || !lostID) {
            continue;
          }
          this.subscriptions.remove(lostID, fieldSelection, specs, variables);
        }
        if (contentChanged || oldIDs.length === 0 && newIDs.length === 0) {
          layer.writeLink(parent, key, linkedIDs);
        }
        for (const id of newIDs.filter((id2) => !oldIDs.includes(id2))) {
          if (id == null) {
            continue;
          }
          this.subscriptions.addMany({
            parent: id,
            subscribers: currentSubscribers,
            variables,
            parentType: linkedType
          });
        }
      }
      for (const operation of operations || []) {
        let parentID;
        if (operation.parentID) {
          if (operation.parentID.kind !== "Variable") {
            parentID = operation.parentID.value;
          } else {
            const id = variables[operation.parentID.value];
            if (typeof id !== "string") {
              throw new Error("parentID value must be a string");
            }
            parentID = id;
          }
        }
        if (operation.list && !this.lists.get(operation.list, parentID, operation.target === "all")) {
          continue;
        }
        const targets = Array.isArray(value) ? value : [value];
        for (const target of targets) {
          if (operation.action === "insert" && target instanceof Object && fieldSelection && operation.list) {
            this.cache.list(operation.list, parentID, operation.target === "all").when(operation.when).addToList(
              fieldSelection,
              target,
              variables,
              operation.position || "last"
            );
          } else if (operation.action === "remove" && target instanceof Object && fieldSelection && operation.list) {
            this.cache.list(operation.list, parentID, operation.target === "all").when(operation.when).remove(target, variables);
          } else if (operation.action === "delete" && operation.type) {
            if (typeof target !== "string") {
              throw new Error("Cannot delete a record with a non-string ID");
            }
            const targetID = this.id(operation.type, target);
            if (!targetID) {
              continue;
            }
            this.cache.delete(targetID);
          } else if (operation.action === "toggle" && target instanceof Object && fieldSelection && operation.list) {
            this.cache.list(operation.list, parentID, operation.target === "all").when(operation.when).toggleElement(
              fieldSelection,
              target,
              variables,
              operation.position || "last"
            );
          }
        }
      }
    }
    return toNotify;
  }
  getSelection({
    selection,
    parent = rootID,
    variables,
    stepsFromConnection = null
  }) {
    if (parent === null) {
      return { data: null, partial: false, stale: false, hasData: true };
    }
    const target = {};
    let hasData = false;
    let partial = false;
    let cascadeNull = false;
    let stale = false;
    const typename = this.storage.get(parent, "__typename").value;
    let targetSelection = getFieldsForType(selection, typename);
    for (const [
      attributeName,
      { type, keyRaw, selection: fieldSelection, nullable, list }
    ] of Object.entries(targetSelection)) {
      const key = evaluateKey(keyRaw, variables);
      const { value } = this.storage.get(parent, key);
      const dt_field = this.staleManager.getFieldTime(parent, key);
      if (dt_field === null) {
        stale = true;
      }
      let nextStep = stepsFromConnection;
      if (nextStep !== null) {
        if (nextStep >= 2) {
          nextStep = null;
        } else {
          nextStep += 1;
        }
      }
      if (list?.connection) {
        nextStep = 0;
      }
      const embeddedCursor = key === "cursor" && stepsFromConnection === 1;
      if (typeof value === "undefined" && !embeddedCursor) {
        partial = true;
      }
      if (typeof value === "undefined" || value === null) {
        target[attributeName] = null;
        if (typeof value !== "undefined") {
          hasData = true;
        }
      } else if (!fieldSelection) {
        const fnUnmarshal = this.config?.scalars?.[type]?.unmarshal;
        if (fnUnmarshal) {
          target[attributeName] = fnUnmarshal(value);
        } else {
          target[attributeName] = value;
        }
        hasData = true;
      } else if (Array.isArray(value)) {
        const listValue = this.hydrateNestedList({
          fields: fieldSelection,
          variables,
          linkedList: value,
          stepsFromConnection: nextStep
        });
        target[attributeName] = listValue.data;
        if (listValue.partial) {
          partial = true;
        }
        if (listValue.stale) {
          stale = true;
        }
        if (listValue.hasData || value.length === 0) {
          hasData = true;
        }
      } else {
        const objectFields = this.getSelection({
          parent: value,
          selection: fieldSelection,
          variables,
          stepsFromConnection: nextStep
        });
        target[attributeName] = objectFields.data;
        if (objectFields.partial) {
          partial = true;
        }
        if (objectFields.stale) {
          stale = true;
        }
        if (objectFields.hasData) {
          hasData = true;
        }
      }
      if (target[attributeName] === null && !nullable && !embeddedCursor) {
        cascadeNull = true;
      }
    }
    return {
      data: cascadeNull ? null : target,
      partial: hasData && partial,
      stale: hasData && stale,
      hasData
    };
  }
  id(type, data) {
    const id = typeof data === "string" ? data : this.computeID(type, data);
    if (!id) {
      return null;
    }
    if (!type) {
      return id;
    }
    return type + ":" + id;
  }
  idFields(type) {
    return keyFieldsForType(this.config, type);
  }
  computeID(type, data) {
    return computeID(this.config, type, data);
  }
  hydrateNestedList({
    fields,
    variables,
    linkedList,
    stepsFromConnection
  }) {
    const result = [];
    let partialData = false;
    let stale = false;
    let hasValues = false;
    for (const entry of linkedList) {
      if (Array.isArray(entry)) {
        const nestedValue = this.hydrateNestedList({
          fields,
          variables,
          linkedList: entry,
          stepsFromConnection
        });
        result.push(nestedValue.data);
        if (nestedValue.partial) {
          partialData = true;
        }
        continue;
      }
      if (entry === null) {
        result.push(entry);
        continue;
      }
      const {
        data,
        partial,
        stale: local_stale,
        hasData
      } = this.getSelection({
        parent: entry,
        selection: fields,
        variables,
        stepsFromConnection
      });
      result.push(data);
      if (partial) {
        partialData = true;
      }
      if (local_stale) {
        stale = true;
      }
      if (hasData) {
        hasValues = true;
      }
    }
    return {
      data: result,
      partial: partialData,
      stale,
      hasData: hasValues
    };
  }
  extractNestedListIDs({
    value,
    abstract,
    recordID,
    key,
    linkedType,
    fields,
    variables,
    applyUpdates,
    specs,
    layer,
    forceNotify
  }) {
    const nestedIDs = [];
    const newIDs = [];
    for (const [i, entry] of value.entries()) {
      if (Array.isArray(entry)) {
        const inner = this.extractNestedListIDs({
          value: entry,
          abstract,
          recordID,
          key,
          linkedType,
          fields,
          variables,
          applyUpdates,
          specs,
          layer,
          forceNotify
        });
        newIDs.push(...inner.newIDs);
        nestedIDs[i] = inner.nestedIDs;
        continue;
      }
      if (entry === null || typeof entry === "undefined") {
        newIDs.push(null);
        nestedIDs[i] = null;
        continue;
      }
      const entryObj = entry;
      let linkedID = `${recordID}.${key}[${this.storage.nextRank}]`;
      const embedded = this.idFields(linkedType)?.filter(
        (field) => typeof entry[field] === "undefined"
      ).length > 0;
      const typename = entryObj.__typename;
      let innerType = linkedType;
      if (abstract) {
        if (!typename) {
          throw new Error("Encountered interface type without __typename in the payload");
        }
        innerType = typename;
      }
      if (!embedded) {
        const id = this.id(innerType, entry);
        if (id) {
          linkedID = id;
        } else {
          continue;
        }
      }
      this.writeSelection({
        root: rootID,
        selection: fields,
        parent: linkedID,
        data: entryObj,
        variables,
        toNotify: specs,
        applyUpdates,
        layer,
        forceNotify
      });
      newIDs.push(linkedID);
      nestedIDs[i] = linkedID;
    }
    return { newIDs, nestedIDs };
  }
  collectGarbage() {
    this.lifetimes.tick();
    if (this.storage.layerCount === 1) {
      this.storage.topLayer.removeUndefinedFields();
    }
  }
}
const rootID = "_ROOT_";
export {
  Cache,
  rootID
};
