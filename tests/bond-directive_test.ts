import "./dom-shim.ts";
import { assertEquals, assertThrows } from "testing/asserts.ts";
import { spy } from "mock/spy.ts";
import { BondDirective } from "../bond-directive.ts";
import { isBound } from "../utilities.ts";
import type { EventPart } from "lit-html/directive.js";

const { test } = Deno;

class Div extends HTMLElement {
  model?: Record<string, unknown>;
  nested?: Record<string, unknown>;
  attributeChangedCallback() {
    return;
  }
}

const bondContext = (
  callback: (host: Div, directive: BondDirective) => void,
) => {
  return () =>
    callback(new Div(), new BondDirective({ type: 5, name: "", tagName: "a" }));
};

test("[BondDirective#constructor] can only be attached to an event expression", () => {
  assertThrows(() => {
    new BondDirective({ type: 1, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new BondDirective({ type: 2 });
  }, Error);
  assertThrows(() => {
    new BondDirective({ type: 3, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new BondDirective({ type: 4, name: "", tagName: "div" });
  }, Error);
  assertEquals(
    new BondDirective({ type: 5, name: "", tagName: "div" }) instanceof
      BondDirective,
    true,
  );
});

test("[BondDirective#constructor] binds the handler", () => {
  const directive = new BondDirective({ type: 5, name: "", tagName: "a" });
  assertEquals(isBound(directive.handler), true);
});

test(
  "[BondDirective#update] bonds to component's property",
  bondContext((host, directive) => {
    assertEquals(directive.recipient, undefined);
    const options = { to: "a" };
    directive.update({ options: { host } } as unknown as EventPart, [options]);
    assertEquals(directive.options, options);
    assertEquals(directive.recipient, host);
    assertEquals(directive.path, "a");
  }),
);

test(
  "[BondDirective#update] bonds to component's nested property",
  bondContext((host, directive) => {
    host.nested = { a: {} };
    const options = { to: "nested.a" };
    directive.update({ options: { host } } as unknown as EventPart, [options]);
    assertEquals(directive.recipient, host.nested);
    assertEquals(directive.path, "a");
  }),
);

test(
  "[BondDirective#update] bonds to component's model if `to` starts with `:`",
  bondContext((host, directive) => {
    host.model = { "a": { b: 1 } };
    const options = { to: ":a.b" };
    directive.update({ options: { host } } as unknown as EventPart, [options]);
    assertEquals(directive.options, options);
    assertEquals(directive.recipient, host.model.a);
    assertEquals(directive.path, "b");
  }),
);

test(
  "[BondDirective#handler] sets a given constant on a property",
  bondContext((host, directive) => {
    host.nested = {};
    const options = { to: "nested.a", value: 1 };
    directive.update({ options: { host } } as unknown as EventPart, [options]);
    directive.handler(new Event("click"));
    assertEquals(host.nested?.a, 1);
  }),
);

test(
  "[BondDirective#handler] prevents default event behavior if `prevent:true`",
  bondContext((host, directive) => {
    host.nested = {};
    const options = { to: "nested.a", value: 1, prevent: true };
    directive.update({ options: { host } } as unknown as EventPart, [options]);
    const event = new Event("click");
    const preventSpy = spy();
    event.preventDefault = preventSpy;
    directive.handler(event);
    assertEquals(preventSpy.calls.length, 1);
  }),
);

test(
  "[BondDirective#handler] sets value from an attribute",
  bondContext((host, directive) => {
    host.nested = {};
    host.setAttribute("abc", "b");
    const options = { to: "nested.a", attribute: "abc" };
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(host.nested?.a, "b");
  }),
);

test(
  "[BondDirective#handler] does not set value if validation fails",
  bondContext((host, directive) => {
    host.nested = { a: 2 };
    host.setAttribute("abc", "1");
    const options = { to: "nested.a", attribute: "abc", validate: () => false };
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(host.nested?.a, 2);
  }),
);

test(
  "[BondDirective#handler] parses value if `parse` function provided",
  bondContext((host, directive) => {
    host.nested = {};
    host.setAttribute("abc", "1");
    const options = { to: "nested.a", attribute: "abc", parse: parseInt };
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(host.nested?.a, 1);
  }),
);

test(
  "[BondDirective#handler] sets value from a property",
  bondContext((host, directive) => {
    host.nested = {};
    host.model = { a: 5 };
    const options = { to: "nested.a", property: "model" };
    directive.update(
      { element: host, options: { host: host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(host.nested?.a, host.model);
  }),
);
