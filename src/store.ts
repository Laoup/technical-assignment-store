import { JSONArray, JSONObject, JSONPrimitive, JSONValue } from "./json-types";

export type Permission = "r" | "w" | "rw" | "none";

export type StoreResult = Store | JSONPrimitive | undefined;

export type StoreValue =
  | JSONObject
  | JSONArray
  | StoreResult
  | (() => StoreResult);

export interface IStore {
  defaultPolicy: Permission;
  allowedToRead(key: string): boolean;
  allowedToWrite(key: string): boolean;
  read(path: string): StoreResult;
  write(path: string, value: StoreValue): StoreValue;
  writeEntries(entries: JSONObject): void;
  entries(): JSONObject;
}

// export function Restrict(...params: unknown[]): any {
// }

export function Restrict(policy: Permission = "none"): any {
  return function (target: any, propertyKey: string) {
    
    // Create a hidden Map and add a restriction on a property (who doesn't exist for now)
    if (!target.constructor._restrictedProps) {
      target.constructor._restrictedProps = new Map<string, Permission>();
    }
    target.constructor._restrictedProps.set(propertyKey, policy);
    Object.defineProperty(target, propertyKey, {
      get: function (/*this: Store*/) {
        return this.read(/*key*/propertyKey)
      },
      set: function (this: Store, newVal: StoreValue) {
        this.policies.set(propertyKey, policy)
        this.values.set(propertyKey, newVal)
      },
      enumerable: true,
      configurable: true
    });
  }
}


export class Store implements IStore {
  defaultPolicy: Permission = "rw";

  policies: Map<string, Permission> = new Map()
  values: Map<string, StoreValue> = new Map()

  constructor() {
    // Initialize policies if decorator defined restrictedProperties
    const restrictedProps = (this.constructor as any)._restrictedProps;

    if (restrictedProps) {
      restrictedProps.forEach((policy: Permission, key: string) => {
        this.policies.set(key, policy);        
      })
    }
  }

  private resolveValue(value: StoreValue): StoreResult {
    if (typeof value === "function")
      return value() as StoreResult

    return value as StoreResult
  }

  allowedToRead(key: string): boolean {
    const refOnPermission= this.policies.get(key)

    if (!refOnPermission) {
      return ["r", "rw"].includes(this.defaultPolicy) 
        ? true
        : false
    }

    if (
        refOnPermission === "r" ||
        refOnPermission === "rw"
      )
      return true
    return false
  }

  allowedToWrite(key: string): boolean {
    const refOnPermission= this.policies.get(key)

    if (!refOnPermission) {
      return ["w", "rw"].includes(this.defaultPolicy)
        ? true
        : false
    }

    if (
        refOnPermission === "w" ||
        refOnPermission === "rw"
      )
      return true
    return false
    
    // throw new Error("Method not implemented.");
  }

  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error("Not allowed to read");
    }

    const segments = path.split(":");
    const firstKey = segments[0];
    
    let value = this.resolveValue(this.values.get(firstKey));
    
    // Simple key:value read
    if (segments.length === 1) {
      return value;
    }
    
    // Navigate through nested stores
    for (let i = 1; i < segments.length; i++) {
      if (value instanceof Store) {
        value = value.read(segments.slice(i).join(":"));
        break; // The nested store handles the rest of the path
      } else {
        // TODO: Can we remove the else ?
        throw new Error(`Cannot read property "${segments[i]}" of non-Store value`);
      }
    }
    
    return value;
  }

  write(path: string, value: StoreValue): StoreValue {
    if (!this.allowedToWrite(path)) {
      throw new Error("Not allowed to write");
    }

    const segments = path.split(":");
    const firstKey = segments[0];
    
    // If there's only one segment, write directly
    if (segments.length === 1) {
      // Convert JSONObject to Store
      if (this.isJSONObject(value)) {
        const nestedStore = new Store();
        nestedStore.defaultPolicy = this.defaultPolicy;
        nestedStore.writeEntries(value as JSONObject);
        this.values.set(path, nestedStore);
        return nestedStore;
      }
      
      this.policies.set(path, this.defaultPolicy);
      this.values.set(path, value);
      return value;
    }
    
    // For nested paths, ensure parent is as a Store
    let parentStore = this.values.get(firstKey);

    if (!parentStore) {
      // Create a new nested store if it doesn't exist
      const newStore = new Store();
      newStore.defaultPolicy = this.defaultPolicy;
      this.values.set(firstKey, newStore);
      parentStore = newStore;
    }

    if (!(parentStore instanceof Store)) {
      throw new Error(`Cannot write to nested path: "${firstKey}" is not a Store`);
    }
    
    // Delegate to the nested store
    return (parentStore as Store)
      .write(
        segments.slice(1).join(":"),
        value
      );
  }

  private isJSONObject(value: StoreValue): boolean {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Store) &&
      typeof value !== "function"
    );
  }

  writeEntries(entries: JSONObject): void {
    const queue: Array<{ prefix: string; obj: JSONObject }> = [
      {
        obj: entries,
        prefix: ""
      }
    ]

    while (queue.length > 0) {
      const { obj, prefix } = queue.shift()!

      for (const [key, value] of Object.entries(obj)) {
        // Here we construct nested key:
        // if the actual key come from a nested. We glue together previous key with current one
        const fullKey = prefix ? `${prefix}:${key}` : key;
        
        // warn: null and [] are consider by JS as "object" that's why we double-check
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // if it's a nested object, we remove one nested level and add it to queue
          queue.push({
            obj: value,
            prefix: fullKey
          })
        }
        else {
          this.write(fullKey, value)
        }
      }
    }
  }

  entries(): JSONObject {
    const res: JSONObject = {}

    const keys = new Set<string>([
      ...Object.keys(this),
      ...(this.values ? Array.from(this.values.keys()) : [])
    ])

    console.log("keys", keys)
    keys.forEach(key => {
      if (!this.allowedToRead(key))
        return

      if (this.values?.has(key)) {
        console.log(this.values.get(key))
        res[key] = this.toJSONValue(this.values.get(key));
      }
      
      return (this as any)[key];
    })

    console.log(res)
    return res
  }

  // convert a value into a JSON-friendly value
  protected toJSONValue(v: unknown): JSONValue {
    if (v instanceof Store) return v.entries();

    if (Array.isArray(v)) return v.map(x => this.toJSONValue(x));

    if (v && typeof v === "object") {
      const obj: JSONObject = {};
      for (const key of Object.keys(v as Record<string, unknown>)) {
        const val = (v as any)[key];
        if (typeof val !== "function") obj[key] = this.toJSONValue(val);
      }
      return obj;
    }
    if (typeof v === "function") {
      return null; // not representable in JSON;
    }
    return v as JSONPrimitive;
  }
}
