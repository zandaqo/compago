import "./dom-shim.ts";
import { assertEquals } from "testing/asserts.ts";
import { Spy, spy } from "mock/spy.ts";
import { ReactiveElement } from "@lit/reactive-element";
import { Observing } from "../observer.ts";
import { ChangeEvent, ChangeType } from "../change-event.ts";
import { Observable } from "../observable.ts";
import { isBound } from "../utilities.ts";

const { test } = Deno;

export class LitElement extends ReactiveElement {
  connectedCallback() {}
  disconnectedCallback() {}
  attributeChangedCallback() {}
  requestUpdate() {}
}

// deno-lint-ignore no-explicit-any
class ComponentClass extends Observing<any>(LitElement) {
  static translations = { en: { two: "two" }, es: { two: "dos" } };
}

const componentContext = (callback: (component: ComponentClass) => void) => {
  return () => {
    callback(new ComponentClass());
  };
};

test(
  "[Component#disconnectedCallback] removes observable",
  componentContext((component) => {
    const observable = new Observable({});
    component.$ = observable;
    assertEquals(component.$, observable);
    component.disconnectedCallback();
    assertEquals(component.$, undefined);
  }),
);

test(
  "[Component#onObservableChange] requests component update",
  componentContext((component) => {
    const updateSpy = spy(component, "requestUpdate");
    component.onObservableChange(new ChangeEvent("a", ChangeType.Set));
    assertEquals(updateSpy.calls.length, 1);
  }),
);

test(
  "[Component#$] subscribes to observable change event",
  componentContext((component) => {
    const observable = new Observable({ a: 20 });
    const changeSpy = spy(component, "onObservableChange");
    assertEquals(isBound(component.onObservableChange), false);
    component.$ = observable;
    assertEquals(component.$, observable);
    assertEquals(isBound(component.onObservableChange), true);
    assertEquals(changeSpy.calls.length, 0);
    observable.a = 10;
    assertEquals(changeSpy.calls.length, 1);
    assertEquals(changeSpy.calls[0].args[0].path, ":a");
    assertEquals(changeSpy.calls[0].args[0].kind, ChangeType.Set);
  }),
);

test(
  "[Component#$] does not subscribe twice to the same observable",
  componentContext((component) => {
    const observable = new Observable({});
    observable.addEventListener = spy();
    component.$ = observable;
    component.$ = observable;
    assertEquals((observable.addEventListener as Spy<void>).calls.length, 1);
  }),
);

test(
  "[Component#$] unsubscribes from the old observable when replacing",
  componentContext((component) => {
    const oldobservable = new Observable({});
    component.$ = oldobservable;
    oldobservable.removeEventListener = spy();
    component.$ = new Observable({});
    assertEquals(
      (oldobservable.removeEventListener as Spy<void>).calls.length,
      1,
    );
  }),
);
