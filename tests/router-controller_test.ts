import "./dom.ts";
import { assertEquals, Spy, spy } from "../dev_deps.ts";
import { RouterController } from "../router-controller.ts";
import type { ReactiveControllerHost } from "../deps.ts";
import { RouteEvent } from "../route-event.ts";

const { test } = Deno;

const routerContext = (
  callback: (
    controller: RouterController<ReactiveControllerHost & HTMLElement>,
  ) => void,
) => {
  const div = document.createElement("div") as unknown as
    & ReactiveControllerHost
    & HTMLElement;
  div.dispatchEvent = spy();
  div.addController = spy();
  const router = new RouterController(div, [
    { name: "home", path: /\/home$/i, action: spy() },
    { name: "user", path: /\/users\/(?<name>.*?)$/i, action: spy() },
  ], "title");
  return () => callback(router);
};

test("[RouterController.constructor] creates a router controller", () => {
  const host = document.createElement("div") as unknown as
    & ReactiveControllerHost
    & HTMLElement;
  host.addController = spy();
  const router = new RouterController(host, [], "title");
  assertEquals(router.host, host);
  assertEquals(router.routes, []);
  assertEquals(router.root, "");
  assertEquals((host.addController as Spy<void>).calls.length, 1);
});

test(
  "[RouterController#goto] emits RouteEvent if the path matches a route",
  routerContext((router) => {
    router.goto("/home");
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 1);
    assertEquals((router.routes[0].action as Spy<void>).calls.length, 1);
    const event = (router.host.dispatchEvent as Spy<void>).calls[0].args[0];
    assertEquals(event instanceof RouteEvent, true);
    assertEquals(event.detail, {
      name: "home",
      params: {},
    });
  }),
);

test(
  "[RouterController#goto] does not emit if the path has not changed",
  routerContext((router) => {
    router.current = "/home";
    router.goto("/home");
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 0);
  }),
);

test(
  "[RouterController#goto] does not emit if the roots don't match",
  routerContext((router) => {
    router.root = "/a";
    router.goto("/home");
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 0);
  }),
);

test(
  "[RouterController#goto] extracts parameters from the path",
  routerContext((router) => {
    router.goto("/users/dibbler");
    assertEquals((router.routes[1].action as Spy<void>).calls.length, 1);
    assertEquals(
      (router.routes[1].action as Spy<void>).calls[0].args[0],
      {
        name: "user",
        params: { name: "dibbler" },
      },
    );
  }),
);

test(
  "[RouterController#onPopstate] reacts to the popstate event",
  routerContext((router) => {
    // deno-lint-ignore no-explicit-any
    (router.constructor as any).location = { pathname: "/home" };
    router.onPopstate(new PopStateEvent("popstate"));
    assertEquals((router.host.dispatchEvent as Spy<void>).calls.length, 1);
    assertEquals((router.routes[0].action as Spy<void>).calls.length, 1);
  }),
);
