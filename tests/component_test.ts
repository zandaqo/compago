import "./dom-shim.ts";
import { assertEquals } from "testing/asserts.ts";
import { Spy, spy } from "mock/spy.ts";
import { Component } from "../component.ts";
import { ChangeEvent, ChangeType } from "../change-event.ts";
import { LanguageChangeEvent } from "../language-change-event.ts";
import { RouteEvent } from "../route-event.ts";
import { Observable } from "../observable.ts";
import { Translator } from "../translator.ts";
import { isBound } from "../utilities.ts";

const { test } = Deno;

// deno-lint-ignore no-explicit-any
class ComponentClass extends Component<any> {
  static translations = { en: { two: "two" }, es: { two: "dos" } };
}

const translator = Translator.initialize({
  languages: ["en", "es"],
  translations: { en: {}, es: {} },
});

const componentContext = (callback: (component: ComponentClass) => void) => {
  return () => {
    callback(new ComponentClass());
  };
};

test(
  "[Component#connectedCallback] subscribes to language change event if global translator is set",
  componentContext((component) => {
    const translatorSpy = spy(translator, "addEventListener");
    assertEquals(isBound(component.onLanguageChange), false);
    component.connectedCallback();
    assertEquals(isBound(component.onLanguageChange), true);
    assertEquals(translatorSpy.calls[0].args, [
      "language-change",
      component.onLanguageChange,
    ]);
    translatorSpy.restore();
  }),
);

test(
  "[Component#disconnectedCallback] removes subscription to the global translator",
  componentContext((component) => {
    const translatorSpy = spy(translator, "removeEventListener");
    component.connectedCallback();
    component.disconnectedCallback();
    assertEquals(translatorSpy.calls[0].args, [
      "language-change",
      component.onLanguageChange,
    ]);
    translatorSpy.restore();
  }),
);

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
  "[Component#disconnectedCallback] removes routes",
  componentContext((component) => {
    const routes = { home: /\//g };
    component.routes = routes;
    assertEquals(component.routes, routes);
    component.disconnectedCallback();
    assertEquals(component.routes, undefined);
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
  "[Component#onLanguageChange] requests component update",
  componentContext((component) => {
    const updateSpy = spy(component, "requestUpdate");
    component.onLanguageChange(new LanguageChangeEvent("en"));
    assertEquals(updateSpy.calls.length, 1);
  }),
);

test(
  "[Component#route] emits route event",
  componentContext((component) => {
    const routeSpy = spy(component, "dispatchEvent");
    const route = "book";
    const params = { id: "a" };
    const query = new URLSearchParams("a=1&b=2");
    const hash = "abc";
    const state = {};
    component.route(route, params, query, hash, state);
    assertEquals(routeSpy.calls.length, 1);
    assertEquals(routeSpy.calls[0].args[0] instanceof RouteEvent, true);
    assertEquals(routeSpy.calls[0].args[0].route, route);
    assertEquals(routeSpy.calls[0].args[0].params, params);
    assertEquals(routeSpy.calls[0].args[0].query, query);
    assertEquals(routeSpy.calls[0].args[0].hash, hash);
    assertEquals(routeSpy.calls[0].args[0].state, state);
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

test(
  "[Component#routes] adds routes and subscribes to global popstate event",
  componentContext((component) => {
    const routes = { home: /\//g };
    const changeSpy = spy(globalThis, "addEventListener");
    assertEquals(isBound(component.onPopstate), false);
    component.routes = routes;
    assertEquals(component.routes, routes);
    assertEquals(isBound(component.onPopstate), true);
    assertEquals(changeSpy.calls.length, 1);
    assertEquals(changeSpy.calls[0].args, ["popstate", component.onPopstate]);
    changeSpy.restore();
  }),
);

test(
  "[Component#routes] removes routes if none provided",
  componentContext((component) => {
    const routes = { home: /\//g };
    const changeSpy = spy(globalThis, "removeEventListener");
    component.routes = routes;
    assertEquals(component.routes, routes);
    component.routes = undefined;
    assertEquals(component.routes, undefined);
    assertEquals(changeSpy.calls.length, 1);
    assertEquals(changeSpy.calls[0].args, ["popstate", component.onPopstate]);
    changeSpy.restore();
  }),
);

/*
TODO: test onPopstate once Deno allows location access
test(
  "[Component#onPopstate] emits `route` event if the url matches a route",
  componentContext((component) => {
    const routes = {
      home: /^\/$/,
      about: /^\/about$/,
      user: /^\/user\/(?<name>[^/]+)$/,
    };
    component.routes = routes;
    component.route = spy();
    globalThis.location.assign('/user/arthur?a=1&b=2#abc');
    component.onPopstate(new PopStateEvent("popstate", { state: { a: 10 } }));
    assertEquals((component.route as Spy<void>).calls.length, 1);
    assertEquals((component.route as Spy<void>).calls[0].args, [
      "user",
      { name: "arthur" },
      new URLSearchParams(location.search),
      location.hash,
      { a: 10 },
    ]);
  }),
);
*/
