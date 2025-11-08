import { lazy } from "./lazy";
import { Restrict, Store, StoreResult, StoreValue } from "./store";
import { UserStore } from "./userStore";



export class AdminStore extends Store {
  // @Restrict("r")
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
    const splited = key.split(":")
    if (splited[0] === "user") {
      return this.user.allowedToRead(splited[1])
    }
    return super.allowedToRead(key)
  }

  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error("Not allowed to read");
    }

    if (path.includes(":")) {
      const splited = path.split(":")
      if (splited[0] === "user")
        return this.user.read(splited[1])
    }

    return super.read(path)
  }

  //
  allowedToWrite(key: string): boolean {
    const splited = key.split(":")
    // Can we consider this if only check if not null because we follow a format ? (same for allowedToRead)
    if (splited[0] === "user") {
      return this.user.allowedToWrite(splited[1])
    }
    
    return super.allowedToWrite(key)
  }

  write(path: string, value: StoreValue): StoreValue {
    if (!this.allowedToWrite(path)) {
      throw new Error("Not allowed to write")
    }

    if (path.includes(":")) {
      const splited = path.split(":")
      if (splited[0] === "user")
        return this.user.write(splited[1], value)
    }
  }
}
