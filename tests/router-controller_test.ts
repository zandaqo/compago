import "./dom-shim.ts";
import { assertEquals, Spy, spy } from "../dev_deps.ts";
import { RouterController } from "../router-controller.ts";
import type { ReactiveControllerHost } from "../deps.ts";
import { isBound } from "../utilities.ts";
import { RouteEvent } from "../route-event.ts";

const { test } = Deno;

class RoutedElement implements ReactiveControllerHost {
  addController = spy();
  removeController = spy();
  requestUpdate = spy();
  updateComplete = Promise.resolve(true);
  dispatchEvent = spy();
  outlet = "";
}

const routerContext = (
  callback: (controller: RouterController<RoutedElement>) => void,
) => {
  const router = new RouterController(new RoutedElement(), [
    { name: "home", path: /\/home$/i, action: spy() },
    { name: "user", path: /\/users\/(?<name>.*?)$/i, action: spy() },
  ], "outlet");
  return () => callback(router);
};

test("[RouterController.constructor] creates a router controller", () => {
  const host = new RoutedElement();
  const router = new RouterController(host, [], "outlet");
  assertEquals(router.host, host);
  assertEquals(router.routes, []);
  assertEquals(router.root, "");
  assertEquals((host.addController as Spy<void>).calls.length, 1);
  assertEquals(isBound(router.onPopstate), true);
});

test(
  "[RouterController#onPopstate] emits RouteEvent if the path matches a route",
  routerContext((router) => {
    // deno-lint-ignore no-explicit-any
    (router.constructor as any).location = { pathname: "/home" };
    router.onPopstate(new PopStateEvent("popstate"));
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 1);
    assertEquals((router.routes[0].action as Spy<void>).calls.length, 1);
    const event = (router.host.dispatchEvent as Spy<void>).calls[0].args[0];
    assertEquals(event instanceof RouteEvent, true);
    assertEquals(event.detail, {
      name: "home",
      params: {},
      hash: undefined,
      query: undefined,
      state: undefined,
    });
  }),
);

test(
  "[RouterController#onPopstate] does not emit if the path has not changed",
  routerContext((router) => {
    router.current = "/home";
    // deno-lint-ignore no-explicit-any
    (router.constructor as any).location = { pathname: "/home" };
    router.onPopstate(new PopStateEvent("popstate"));
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 0);
  }),
);

test(
  "[RouterController#onPopstate] does not emit if the roots don't match",
  routerContext((router) => {
    router.root = "/a";
    // deno-lint-ignore no-explicit-any
    (router.constructor as any).location = { pathname: "/home" };
    router.onPopstate(new PopStateEvent("popstate"));
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 0);
  }),
);

test(
  "[RouterController#onPopstate] extracts parameters, hash, and search parameters from the path",
  routerContext((router) => {
    // deno-lint-ignore no-explicit-any
    (router.constructor as any).location = {
      pathname: "/users/dibbler",
      search: "?a=1&b=2",
      hash: "#abc",
    };
    router.onPopstate(new PopStateEvent("popstate", { state: { a: 3 } }));
    assertEquals((router.routes[1].action as Spy<void>).calls.length, 1);
    assertEquals(
      (router.routes[1].action as Spy<void>).calls[0].args[0],
      {
        name: "user",
        params: { name: "dibbler" },
        hash: "#abc",
        query: new URLSearchParams("?a=1&b=2"),
        state: { a: 3 },
      },
    );
  }),
);
