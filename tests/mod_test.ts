import "./dom.ts";
import { assert, assertEquals } from "../dev_deps.ts";

const mod = await import("../mod.ts");

Deno.test("Public API Assertions", () => {
  assert(mod != null);
  assertEquals(typeof mod.ChangeEvent, "function");
  assertEquals(typeof mod.ChangeType, "object");
  assertEquals(typeof mod.bond, "function");
  assertEquals(typeof mod.Observable, "function");
  assertEquals(typeof mod.ObserverElement, "function");
  assertEquals(typeof mod.observer, "function");
  assertEquals(typeof mod.observe, "function");
  assertEquals(typeof mod.Result, "object");
  assertEquals(typeof mod.RESTRepository, "function");
});
