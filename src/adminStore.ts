import { lazy } from "./lazy";
import { Restrict, Store, StoreResult, StoreValue } from "./store";
import { UserStore } from "./userStore";


export class AdminStore extends Store {
  @Restrict("r")
  public user: UserStore;

  @Restrict()
  name: string = "John Doe";
  
  // @Restrict("rw")
  // getCredentials = lazy(() => {
  //   const credentialStore = new Store();
  //   credentialStore.writeEntries({ username: "user1" });
  //   return credentialStore;
  // });

  constructor(user: UserStore) {
    super();
    this.defaultPolicy = "none";
    this.user = user;
  }

  allowedToRead(key: string): boolean {
    let store

    const splited = key.split(":")
    // Should be replace by this.values.get(splited[0]) as Store ?
    if (splited[0] === "user") {
      store = this.values.get("user") as UserStore;
    }

    if (splited.length > 1 && store)
      return store.allowedToRead(splited.slice(1).join(":"));

    return super.allowedToRead(key)
  }

  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error("Not allowed to read");
    }

    const splited = path.split(":");
    if (splited[0] === "user") {
      // Should be replace by this.values.get(splited[0]) as Store ? (and rename userStore into store)
      const userStore = this.values.get("user") as UserStore;
      if (splited.length === 1) {
        return userStore;
      }
      // Nested
      return userStore.read(splited.slice(1).join(":"));
    }

    return super.read(path);
  }

  allowedToWrite(key: string): boolean {
    let store
    
    const splited = key.split(":")

    // Should be replace by this.values.get(splited[0]) as Store ?
    if (splited[0] === "user") {
      store = this.values.get("user") as UserStore
    }

    if (splited.length > 1 && store)
      return store.allowedToWrite(splited.slice(1).join(":"));

    return super.allowedToWrite(key)
  }

  write(path: string, value: StoreValue): StoreValue {
    if (!this.allowedToWrite(path)) {
      throw new Error("Not allowed to write");
    }

    const splited = path.split(":");
    if (splited[0] === "user") {
      // Should be replace by this.values.get(splited[0]) as Store ? (Then need to change the error)
      const userStore = this.values.get("user") as UserStore;
      if (splited.length === 1) {
        throw new Error("Cannot replace user store");
      }
      return userStore.write(splited.slice(1).join(":"), value);
    }

    return super.write(path, value);
  }

  //OLD

  // allowedToRead(key: string): boolean {
  //   const splited = key.split(":")
  //   if (splited[0] === "user") {
  //     return this.user.allowedToRead(splited[1])
  //   }
  //   return super.allowedToRead(key)
  // }

  // read(path: string): StoreResult {
  //   if (!this.allowedToRead(path)) {
  //     throw new Error("Not allowed to read");
  //   }

  //   if (path.includes(":")) {
  //     const splited = path.split(":")
  //     if (splited[0] === "user")
  //       return this.user.read(splited[1])
  //   }

  //   return super.read(path)
  // }

  // //
  // allowedToWrite(key: string): boolean {
  //   const splited = key.split(":")
  //   // Can we consider this if only check if not null because we follow a format ? (same for allowedToRead)
  //   if (splited[0] === "user") {
  //     return this.user.allowedToWrite(splited[1])
  //   }
    
  //   return super.allowedToWrite(key)
  // }

  // write(path: string, value: StoreValue): StoreValue {
  //   if (!this.allowedToWrite(path)) {
  //     throw new Error("Not allowed to write")
  //   }

  //   if (path.includes(":")) {
  //     const splited = path.split(":")
  //     if (splited[0] === "user")
  //       return this.user.write(splited[1], value)
  //   }
  // }
}
