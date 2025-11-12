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

export function Restrict(...params: unknown[]): any {
}


export class Store implements IStore {
  defaultPolicy: Permission = "rw";

  allowedToRead(key: string): boolean {
    throw new Error("Method not implemented.");
  }

  allowedToWrite(key: string): boolean {
    throw new Error("Method not implemented.");
  }

  read(path: string): StoreResult {
    throw new Error("Method not implemented.");
  }

  write(path: string, value: StoreValue): StoreValue {
    throw new Error("Method not implemented.");
  }

  writeEntries(entries: JSONObject): void {
    throw new Error("Method not implemented.");
  }

  entries(): JSONObject {
    throw new Error("Method not implemented.");
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
