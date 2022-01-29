import "./dom.ts";
import { assertEquals, Spy, spy } from "../dev_deps.ts";
import { ChangeEvent, ChangeType } from "../change-event.ts";
import { Observable } from "../observable.ts";

const { test } = Deno;
const { ObserverElement } = await import("../observer-element.ts");

// deno-lint-ignore no-explicit-any
class ComponentClass extends ObserverElement<any> {}
customElements.define("c-component", ComponentClass);

const componentContext = (callback: (component: ComponentClass) => void) => {
  return () => {
    callback(document.createElement("c-component") as ComponentClass);
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
    component.$ = observable;
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
