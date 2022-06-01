import "./dom.ts";
import { assertEquals, assertThrows, spy } from "./test_deps.ts";
import type { EventPart } from "../deps.ts";
import type { BondDirective as BondType } from "../bond-directive.ts";

const { test } = Deno;
const { LitElement } = await import("../deps.ts");
const { BondDirective } = await import("../bond-directive.ts");

class ComponentClass extends LitElement {
  nested?: Record<string, unknown>;
}

customElements.define("c-component", ComponentClass);

type Recipient = {
  a: number;
  b: string;
  c: Array<number>;
};

const bondContext = (
  callback: (
    recipient: Recipient,
    directive: BondType<Recipient, keyof Recipient>,
  ) => void,
) => {
  return () =>
    callback(
      { a: 1, b: "", c: [] },
      new BondDirective<Recipient, keyof Recipient>({
        type: 5,
        name: "",
        tagName: "a",
      }),
    );
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

test(
  "[BondDirective#handler] sets a given constant",
  bondContext((recipient, directive) => {
    const options = { to: recipient, key: "a", value: 10 } as const;
    directive.update({} as unknown as EventPart, [options]);
    directive.handler(new Event("click"));
    assertEquals(recipient.a, 10);
  }),
);

test(
  "[BondDirective#handler] prevents default event behavior if `prevent:true`",
  bondContext((recipient, directive) => {
    const options = {
      to: recipient,
      key: "a",
      value: 10,
      prevent: true,
    } as const;
    directive.update({} as unknown as EventPart, [options]);
    const event = new Event("click");
    const preventSpy = spy();
    event.preventDefault = preventSpy;
    directive.handler(event);
    assertEquals(preventSpy.calls.length, 1);
    assertEquals(recipient.a, 10);
  }),
);

test(
  "[BondDirective#handler] sets value from an attribute",
  bondContext((recipient, directive) => {
    const host = document.createElement("div");
    host.setAttribute("abc", "xyz");
    const options = { to: recipient, key: "b", attribute: "abc" } as const;
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(recipient.b, "xyz");
  }),
);

test(
  "[BondDirective#handler] sets value from a property",
  bondContext((recipient, directive) => {
    const host = document.createElement("div");
    const options = { to: recipient, key: "b", property: "nodeName" } as const;
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(recipient.b, "DIV");
  }),
);

test(
  "[BondDirective#handler] does not set value if validation fails",
  bondContext((recipient, directive) => {
    const host = document.createElement("div");
    host.setAttribute("abc", "xyz");
    const options = {
      to: recipient,
      key: "b",
      attribute: "abc",
      validate: () => false,
    } as const;
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(recipient.b, "");
  }),
);

test(
  "[BondDirective#handler] parses value if `parse` function provided",
  bondContext((recipient, directive) => {
    const host = document.createElement("div");
    host.setAttribute("abc", "100");
    const options = {
      to: recipient,
      key: "a",
      attribute: "abc",
      parse: parseInt,
    } as const;
    directive.update(
      { element: host, options: { host } } as unknown as EventPart,
      [options],
    );
    directive.handler(new Event("click"));
    assertEquals(recipient.a, 100);
  }),
);
