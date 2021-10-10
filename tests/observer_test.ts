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
  "[Component#disconnectedCallback] removes model",
  componentContext((component) => {
    const model = new Observable({});
    component.model = model;
    assertEquals(component.model, model);
    component.disconnectedCallback();
    assertEquals(component.model, undefined);
  }),
);

test(
  "[Component#onModelChange] requests component update",
  componentContext((component) => {
    const updateSpy = spy(component, "requestUpdate");
    component.onModelChange(new ChangeEvent("a", ChangeType.Set));
    assertEquals(updateSpy.calls.length, 1);
  }),
);

test(
  "[Component#model] subscribes to model change event",
  componentContext((component) => {
    const model = new Observable({ a: 20 });
    const changeSpy = spy(component, "onModelChange");
    assertEquals(isBound(component.onModelChange), false);
    component.model = model;
    assertEquals(component.model, model);
    assertEquals(isBound(component.onModelChange), true);
    assertEquals(changeSpy.calls.length, 0);
    model.a = 10;
    assertEquals(changeSpy.calls.length, 1);
    assertEquals(changeSpy.calls[0].args[0].path, ":a");
    assertEquals(changeSpy.calls[0].args[0].kind, ChangeType.Set);
  }),
);

test(
  "[Component#model] does not subscribe twice to the same model",
  componentContext((component) => {
    const model = new Observable({});
    model.addEventListener = spy();
    component.model = model;
    component.model = model;
    assertEquals((model.addEventListener as Spy<void>).calls.length, 1);
  }),
);

test(
  "[Component#model] unsubscribes from the old model when replacing",
  componentContext((component) => {
    const oldModel = new Observable({});
    component.model = oldModel;
    oldModel.removeEventListener = spy();
    component.model = new Observable({});
    assertEquals((oldModel.removeEventListener as Spy<void>).calls.length, 1);
  }),
);
