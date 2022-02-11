import "./dom.ts";
import { assertEquals, Spy, spy } from "../dev_deps.ts";
import type { ObservableController as ObservableType } from "../observable-controller.ts";

const { test } = Deno;
const { LitElement } = await import("../deps.ts");
const { ObservableController } = await import("../observable-controller.ts");

class ComponentClass extends LitElement {
  state!: ObservableType<{ a: number }> & { a: number };
  // TODO: workaround for lit/ts bug, fix when upstream updated
  get updateComplete() {
    return Promise.resolve(true);
  }
}
customElements.define("c-observable-controller", ComponentClass);

const componentContext = (
  callback: (component: ComponentClass, callback: Spy<void>) => void,
) => {
  const host = document.createElement(
    "c-observable-controller",
  ) as ComponentClass;
  const cb = spy();
  host.state = new ObservableController(host, { a: 1 }, cb);
  return () => {
    callback(
      host,
      cb,
    );
  };
};

test(
  "[ObservableController#constructor] attaches controller to a host",
  componentContext((component, callback) => {
    assertEquals(component.state instanceof ObservableController, true);
    assertEquals(component.state.onObservableChange, callback);
    assertEquals(
      // deno-lint-ignore no-explicit-any
      (component.state as any)[Symbol.for("c-observable-host")],
      component,
    );
  }),
);

test(
  "[ObservableController#onObservableChange] requests host update when observable changes",
  componentContext((component, callback) => {
    assertEquals(callback.calls.length, 0);
    document.body.appendChild(component);
    component.state.a = 2;
    component.state.a = 3;
    assertEquals(callback.calls.length, 2);
  }),
);
