import "./dom.ts";
import { assertEquals, Spy, spy } from "../dev_deps.ts";
import { ChangeEvent, ChangeType } from "../change-event.ts";
import { Observable } from "../observable.ts";
import { observe, observer } from "../observer.ts";

const { test } = Deno;
const { LitElement } = await import("../deps.ts");

@observer()
class ObserverClass extends LitElement {
  @observe()
  // deno-lint-ignore no-explicit-any
  $: Observable<any> = new Observable({ a: 20 });
}

customElements.define("c-component", ObserverClass);

const componentContext = (callback: (component: ObserverClass) => void) => {
  return () => {
    callback(document.createElement("c-component") as ObserverClass);
  };
};

test(
  "[ObserverElement#constructor] creates accessors for observable properties",
  componentContext((component) => {
    const descriptor = Object.getOwnPropertyDescriptor(
      component,
      "$",
    )!;
    assertEquals(descriptor.get instanceof Function, true);
    assertEquals(descriptor.set instanceof Function, true);
  }),
);

test(
  "[ObserverElement#observable] subscribes to observable change event",
  componentContext((component) => {
    const observable = new Observable({ a: 20 });
    observable.addEventListener = spy();
    component.$ = observable;
    assertEquals((observable.addEventListener as Spy<void>).calls.length, 1);
  }),
);

test(
  "[ObserverElement#observable] does not subscribe twice to the same observable",
  componentContext((component) => {
    const observable = new Observable({});
    observable.addEventListener = spy();
    component.$ = observable;
    component.$ = observable;
    assertEquals((observable.addEventListener as Spy<void>).calls.length, 1);
  }),
);

test(
  "[ObserverElement#observable] unsubscribes from the old observable when replacing",
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

test(
  "[ObserverElement#observable] schedules updates when observable changes",
  componentContext((component) => {
    const observable = new Observable({ a: { b: 1 } });
    const updateSpy: Spy<void> = spy();
    component.requestUpdate = updateSpy;
    component.$ = observable.a;
    observable.a.b = 2;
    assertEquals(updateSpy.calls[0].args[0], "$");
    assertEquals(updateSpy.calls[1].args[0], "$.b");
    assertEquals(
      (updateSpy.calls[1].args[1] as ChangeEvent)
        .path,
      ".a.b",
    );
    assertEquals(
      (updateSpy.calls[1].args[1] as ChangeEvent)
        .kind,
      ChangeType.Set,
    );
  }),
);
