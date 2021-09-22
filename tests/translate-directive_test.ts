import "./dom-shim.ts";
import { assertEquals, assertThrows } from "testing/asserts.ts";
import { spy } from "mock/spy.ts";
import { TranslateDirective } from "../translate-directive.ts";
import type { AttributePart } from "lit-html/directive.js";

const { test } = Deno;

class Div extends HTMLElement {
  attributeChangedCallback() {
    return;
  }
  static translate(_key: string, _interpolation?: unknown) {
    return;
  }
}

test("[TranslateDirective#constructor] only supports attribute, property, and child expressions", () => {
  assertThrows(() => {
    new TranslateDirective({ type: 5, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new TranslateDirective({ type: 4, name: "", tagName: "div" });
  }, Error);
  assertEquals(
    new TranslateDirective({ type: 1, name: "", tagName: "div" }) instanceof
      TranslateDirective,
    true,
  );
});

test("[TranslateDirective#update] stores given host constructor on the directive", () => {
  const host = new Div();
  const directive = new TranslateDirective({ type: 1, name: "", tagName: "a" });
  assertEquals(directive.host, undefined);
  directive.update(
    { type: 1, options: { host } } as unknown as AttributePart,
    ["a", {}],
  );
  assertEquals(directive.host, Div);
});

test("[TranslateDirective#render] calls a translator", () => {
  const host = new Div();
  const directive = new TranslateDirective({ type: 1, name: "", tagName: "a" });
  const args: [string, unknown] = ["a", {}];
  directive.update(
    { type: 1, options: { host } } as unknown as AttributePart,
    args,
  );
  const translateSpy = spy(Div, "translate");
  directive.render(...args);
  assertEquals(translateSpy.calls[0].args, args);
});
