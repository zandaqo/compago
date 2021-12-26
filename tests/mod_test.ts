import "./dom-shim.ts";
import { assert, assertEquals } from "../dev_deps.ts";
import * as mod from "../mod.ts";

Deno.test("Public API Assertions", () => {
  assert(mod != null);
  assertEquals(typeof mod.ChangeEvent, "function");
  assertEquals(typeof mod.ChangeType, "object");
  assertEquals(typeof mod.RouteEvent, "function");
  assertEquals(typeof mod.LanguageChangeEvent, "function");
  assertEquals(typeof mod.MissingLocalizationEvent, "function");
  assertEquals(typeof mod.bond, "function");
  assertEquals(typeof mod.navigate, "function");
  assertEquals(typeof mod.localize, "function");
  assertEquals(typeof mod.RouterController, "function");
  assertEquals(typeof mod.LocalizerController, "function");
  assertEquals(typeof mod.Observable, "function");
  assertEquals(typeof mod.Observing, "function");
  assertEquals(typeof mod.Localizer, "function");
  assertEquals(typeof mod.Result, "object");
  assertEquals(typeof mod.RESTRepository, "function");
});
