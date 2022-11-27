import "https://deno.land/x/indexeddb@1.3.5/polyfill_memory.ts";
import { assertEquals } from "./test_deps.ts";
import { LocalRepository } from "../local-repository.ts";

class Character {
  name = "";
  planet = "";
  constructor(init: Partial<Character>) {
    Object.assign(this, init);
  }
}

const DATA: Array<Character> = [
  new Character({ name: "Arthur Dent", planet: "Earth" }),
  new Character({ name: "Ford Prefect", planet: "Betelgeuse Five" }),
  new Character({ name: "Zaphod Beeblebrox", planet: "Betelgeuse Five" }),
];

await new Promise<void>((resolve, reject) => {
  const request = globalThis.indexedDB.open("testDb", 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    const store = db.createObjectStore("users", {
      keyPath: "name",
    });
    store.createIndex("name", "name", { unique: true });
  };
  request.onsuccess = async () => {
    const db = request.result;
    await LocalRepository.promisify(
      db.transaction("users", "readwrite").objectStore("users").add(DATA[0]),
    );
    await LocalRepository.promisify(
      db.transaction("users", "readwrite").objectStore("users").add(DATA[1]),
    );
    resolve();
  };
  request.onerror = () => {
    reject();
  };
});

async function getDB() {
  const result = await LocalRepository.promisify(
    globalThis.indexedDB.open("testDb", 1),
  );
  return result.value as IDBDatabase;
}

Deno.test({
  name: "[LocalRepository#constructor] create a repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    assertEquals(repository.db.name, "testDb");
    db.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#has] checks if an object exists in the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    let result = await repository.has("Arthur Dent");
    assertEquals(result.value, true);
    result = await repository.has("Arthur");
    assertEquals(result.value, false);
    result = await repository.has("");
    assertEquals(result.value, false);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#list] returns a list of all objects with a given key",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    const result = await repository.list("Arthur Dent");
    assertEquals(result.value, [DATA[0]]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#list] returns a list of all objects for given keys",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    const result = await repository.list("Arthur Dent", "Ford Prefect");
    assertEquals(result.value, [DATA[0], DATA[1]]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#create] adds an object to the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, false);
    await repository.create(DATA[2]);
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, true);
    await repository.delete("Zaphod Beeblebrox");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#read] get an object from the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    let request = await repository.read("Arthur Dent");
    assertEquals(request.ok, true);
    assertEquals(request.value, DATA[0]);
    request = await repository.read("Ford");
    assertEquals(request.ok, false);
    assertEquals(request.value, undefined);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#update] updates an object in the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    assertEquals((await repository.read("Arthur Dent")).value, DATA[0]);
    const updated = new Character({
      name: "Arthur Dent",
      planet: "Non-existant",
    });
    await repository.update("Arthur Dent", updated);
    assertEquals((await repository.read("Arthur Dent")).value, updated);
    await repository.update("Arthur Dent", DATA[0]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#delete] deletes an object from the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository(Character, db, "users", "name");
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, false);
    await repository.create({
      name: "Zaphod Beeblebrox",
      planet: "Betelgeuse Five",
    });
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, true);
    await repository.delete("Zaphod Beeblebrox");
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, false);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
