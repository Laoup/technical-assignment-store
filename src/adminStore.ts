import { lazy } from "./lazy";
import { Restrict, Store, StoreResult, StoreValue } from "./store";
import { UserStore } from "./userStore";


export class AdminStore extends Store {
  @Restrict("r")
  public user: UserStore;

  @Restrict()
  name: string = "John Doe";
  
  @Restrict("rw")
  getCredentials = lazy(() => {
    const credentialStore = new Store();
    credentialStore.writeEntries({ username: "user1" });
    return credentialStore;
  });

  constructor(user: UserStore) {
    super();
    this.defaultPolicy = "none";
    this.user = user;
  }

 allowedToRead(key: string): boolean {
    let store

    const splited = key.split(":")
    // Nested
    if (splited[0]) {
      store = this.values.get(splited[0]);
    }

    if (splited.length > 1 && store)
      if (typeof store === "function")
        store = store()
      if (store instanceof Store)
        return store.allowedToRead(splited.slice(1).join(":"));

    return super.allowedToRead(key)
  }

  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error("Not allowed to read");
    }

    const splited = path.split(":");
    
    if (splited[0]) {
      // Get the raw value and resolve it (handles lazy functions)
      let storeValue = this.values.get(splited[0]);
      
      // Resolve lazy functions
      if (typeof storeValue === "function") {
        storeValue = storeValue();
      }
      
      if (storeValue instanceof Store) {
        if (splited.length === 1) {
          return storeValue;
        }
        // Nested read
        return storeValue.read(splited.slice(1).join(":"));
      }
    }

    return super.read(path);
  }

  allowedToWrite(key: string): boolean {
    let value
    
    const splited = key.split(":")

    if (splited[0]) {
      value = this.values.get(splited[0])
    }

    if (splited.length > 1 && value) {
      if (typeof value === "function")
        value = value()

      if (value instanceof Store)
        return value.allowedToWrite(splited.slice(1).join(":"));
    }

    return super.allowedToWrite(key)
  }

  write(path: string, value: StoreValue): StoreValue {
    if (!this.allowedToWrite(path)) {
      throw new Error("Not allowed to write");
    }

    const splited = path.split(":");
    
    if (splited[0]) {
      // Get the raw value and resolve it (handles lazy functions)
      let storeValue = this.values.get(splited[0]);
      
      // Resolve lazy functions
      if (typeof storeValue === "function") {
        storeValue = storeValue();
      }
      
      if (storeValue instanceof Store) {
        if (splited.length === 1) {
          throw new Error("Cannot replace a store");
        }
        return storeValue.write(splited.slice(1).join(":"), value);
      }
    }

    return super.write(path, value);
  }

  //OLD

  // read(path: string): StoreResult {
  //   if (!this.allowedToRead(path)) {
  //     throw new Error("Not allowed to read");
  //   }

  //   const splited = path.split(":");
  //   if (splited[0]) {
  //     const store = this.values.get(splited[0]) as Store;
  //     if (splited.length === 1) {
  //       return store;
  //     }
  //     // Nested
  //     return store.read(splited.slice(1).join(":"));
  //   }

  //   return super.read(path);
  // }

  // allowedToWrite(key: string): boolean {
  //   let store
    
  //   const splited = key.split(":")

  //   if (splited[0]) {
  //     store = this.values.get(splited[0]) as Store
  //   }

  //   if (splited.length > 1 && store)
  //     return store.allowedToWrite(splited.slice(1).join(":"));

  //   return super.allowedToWrite(key)
  // }

  // write(path: string, value: StoreValue): StoreValue {
  //   if (!this.allowedToWrite(path)) {
  //     throw new Error("Not allowed to write");
  //   }

  //   const splited = path.split(":");
  //   if (splited[0]) {
  //     const store = this.values.get(splited[0]) as Store;
  //     if (splited.length === 1) {
  //       throw new Error("Cannot replace a store");
  //     }
  //     return store.write(splited.slice(1).join(":"), value);
  //   }

  //   return super.write(path, value);
  // }
}
