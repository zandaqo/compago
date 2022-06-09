import "https://deno.land/x/indexeddb@1.3.0/polyfill_memory.ts";
import { assertEquals } from "./test_deps.ts";
import { LocalRepository } from "../local-repository.ts";

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
      db.transaction("users", "readwrite").objectStore("users").add({
        name: "Arthur Dent",
        planet: "Earth",
      }),
    );
    await LocalRepository.promisify(
      db.transaction("users", "readwrite").objectStore("users").add({
        name: "Ford Prefect",
        planet: "Betelgeuse Five",
      }),
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
    const repository = new LocalRepository(db, "users", "name");
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
    const repository = new LocalRepository(db, "users", "name");
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
  name: "[LocalRepository#create] adds an object to the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository<{ name: string; planet: string }>(
      db,
      "users",
      "name",
    );
    assertEquals((await repository.has("Zaphod Beeblebrox")).value, false);
    await repository.create({
      name: "Zaphod Beeblebrox",
      planet: "Betelgeuse Five",
    });
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
    const repository = new LocalRepository<{ name: string; planet: string }>(
      db,
      "users",
      "name",
    );
    let request = await repository.read("Arthur Dent");
    assertEquals(request.ok, true);
    assertEquals(request.value, { name: "Arthur Dent", planet: "Earth" });
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
    const repository = new LocalRepository<{ name: string; planet: string }>(
      db,
      "users",
      "name",
    );
    assertEquals((await repository.read("Arthur Dent")).value, {
      name: "Arthur Dent",
      planet: "Earth",
    });
    await repository.update("Arthur Dent", {
      name: "Arthur Dent",
      planet: "Non-existant",
    });
    assertEquals((await repository.read("Arthur Dent")).value, {
      name: "Arthur Dent",
      planet: "Non-existant",
    });
    await repository.update("Arthur Dent", {
      name: "Arthur Dent",
      planet: "Earth",
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "[LocalRepository#delete] deletes an object from the repository",
  fn: async () => {
    const db = await getDB();
    const repository = new LocalRepository<{ name: string; planet: string }>(
      db,
      "users",
      "name",
    );
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
