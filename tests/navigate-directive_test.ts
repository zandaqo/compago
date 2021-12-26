import "./dom-shim.ts";
import { assertEquals, assertThrows, spy } from "../dev_deps.ts";
import { NavigateDirective } from "../navigate-directive.ts";
import { isBound } from "../utilities.ts";
import type { EventPart } from "../deps.ts";

const { test } = Deno;

class Div extends HTMLElement {
  attributeChangedCallback() {
    return;
  }
}

test("[NavigateDirective#constructor] can only be attached to an event expression", () => {
  assertThrows(() => {
    new NavigateDirective({ type: 1, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new NavigateDirective({ type: 2 });
  }, Error);
  assertThrows(() => {
    new NavigateDirective({ type: 3, name: "", tagName: "div" });
  }, Error);
  assertThrows(() => {
    new NavigateDirective({ type: 4, name: "", tagName: "div" });
  }, Error);
  assertEquals(
    new NavigateDirective({ type: 5, name: "", tagName: "div" }) instanceof
      NavigateDirective,
    true,
  );
});

test("[NavigateDirective#constructor] binds the handler", () => {
  const directive = new NavigateDirective({ type: 5, name: "", tagName: "a" });
  assertEquals(isBound(directive.handler), true);
});

test("[NavigateDirective#update] stores given path and state on the directive", () => {
  const directive = new NavigateDirective({ type: 5, name: "", tagName: "a" });
  assertEquals(directive.path, undefined);
  assertEquals(directive.state, undefined);
  directive.update(
    { type: 5, name: "", tagName: "a" } as unknown as EventPart,
    ["a", 1],
  );
  assertEquals(directive.path, "a");
  assertEquals(directive.state, 1);
});

test("[NavigateDirective#update] uses element's `href` attribute if no url is provided", () => {
  const element = new Div();
  element.setAttribute("href", "abc");
  const directive = new NavigateDirective({ type: 5, name: "", tagName: "a" });
  assertEquals(directive.path, undefined);
  directive.update(
    { type: 5, name: "", tagName: "a", element } as unknown as EventPart,
    [undefined, undefined],
  );
  assertEquals(directive.path, "abc");
});

test("[NavigateDirective#handler] updates state", () => {
  const pushStateSpy = spy(window.history, "pushState");
  const popEventSpy = spy();
  globalThis.addEventListener("popstate", popEventSpy);
  const event = new Event("click");
  const directive = new NavigateDirective({ type: 5, name: "", tagName: "a" });
  directive.path = "/a";
  directive.state = "b";
  directive.handler(event);

  assertEquals(pushStateSpy.calls, [{
    args: [directive.state, undefined, directive.path],
    self: window.history,
    returned: undefined,
  }]);
  assertEquals(popEventSpy.calls[0].args[0].state, directive.state);

  pushStateSpy.restore();
  globalThis.removeEventListener("popstate", popEventSpy);
});
