import "./dom-shim.ts";
import { assertEquals, assertThrows } from "testing/asserts.ts";
import { spy } from "mock/spy.ts";
import { LocalizeDirective } from "../localize-directive.ts";
import type { AttributePart } from "lit-html/directive.js";

const { test } = Deno;

class Div extends HTMLElement {
  localizer = {
    localize: spy(),
  };
  attributeChangedCallback() {
    return;
  }
}

test("[LocalizeDirective#constructor] only supports attribute, property, and child expressions", () => {
  assertThrows(() => {
    new LocalizeDirective({ type: 5, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new LocalizeDirective({ type: 4, name: "", tagName: "div" });
  }, Error);
  assertEquals(
    new LocalizeDirective({ type: 1, name: "", tagName: "div" }) instanceof
      LocalizeDirective,
    true,
  );
});

test("[LocalizeDirective#update] stores given host constructor on the directive", () => {
  const host = new Div();
  const directive = new LocalizeDirective({ type: 1, name: "", tagName: "a" });
  assertEquals(directive.host, undefined);
  directive.update(
    { type: 1, options: { host } } as unknown as AttributePart,
    ["a", {}],
  );
  assertEquals(directive.host, host);
});

test("[LocalizeDirective#render] calls a localizer", () => {
  const host = new Div();
  const directive = new LocalizeDirective({ type: 1, name: "", tagName: "a" });
  const args: [string, unknown] = ["a", {}];
  directive.update(
    { type: 1, options: { host } } as unknown as AttributePart,
    args,
  );
  directive.render(...args);
  assertEquals(host.localizer.localize.calls[0].args, args);
});
