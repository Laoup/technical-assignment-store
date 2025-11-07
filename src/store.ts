import { JSONArray, JSONObject, JSONPrimitive } from "./json-types";

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
    Object.defineProperty(target, propertyKey, {
      get: function (/*this: Store*/) {
        return this.read(/*key*/propertyKey)
      },
      set: function (this: Store, newVal: StoreValue) {
        console.log(propertyKey)
        console.log(newVal)
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

  private resolveValue(value: StoreValue): StoreResult {
    // TODO
    // if (typeof value === "function")
      //lazy

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

    if (this.allowedToRead(path))
      return this.resolveValue(
        this.values.get(path)
      )
    throw new Error("Not allowed to read");
  }

  write(path: string, value: StoreValue): StoreValue {
    
    this.policies.set(path, this.defaultPolicy)
    this.values.set(path, value)

    return value
  }

  writeEntries(entries: JSONObject): void {
    throw new Error("Method not implemented.");
  }

  entries(): JSONObject {
    throw new Error("Method not implemented.");
  }
}
