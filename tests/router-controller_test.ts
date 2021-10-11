import "./dom-shim.ts";
import { assertEquals } from "testing/asserts.ts";
import { spy } from "mock/spy.ts";
import type { ReactiveControllerHost } from "@lit/reactive-element";
import { RouterController, RoutesMap } from "../router-controller.ts";
import { isBound } from "../utilities.ts";

const { test } = Deno;

/* const routerContext = (
  callback: (controller: RouterController) => void,
) => {
  const router = new RouterController({
    addController() {},
  } as unknown as ReactiveControllerHost, {
    home: [/^\/$/, spy()],
    about: [/^\/about$/, spy()],
    user: [/^\/user\/(?<name>[^/]+)$/, spy()],
  });
  return () => callback(router);
}; */

test(
  "[RouterController#constructor] creates a router controller",
  () => {
    const routes: RoutesMap = { home: [/^\/$/, spy()] };
    const router = new RouterController(
      { addController() {} } as unknown as ReactiveControllerHost,
      routes,
      "/path",
    );
    assertEquals(router.root, "/path");
    assertEquals(router.routes, routes);
    assertEquals(isBound(router.onPopstate), true);
  },
);

/*
TODO: wait for Deno to allow location changing
test(
  "[RouterController#constructor] creates a router controller",
  routerContext((router) => {
    globalThis.location.pathname = "/user/arthur";
    globalThis.location.search = "?a=1&b=2";
    globalThis.location.hash = "#abc";
    router.onPopstate(new PopStateEvent("popstate", { state: { a: 10 } }));
    const userSpy = router.routes.user[1] as Spy<void>;
    assertEquals(userSpy.calls.length, 1);
    assertEquals(userSpy.calls[0].args, [
      "user",
      { name: "arthur" },
      new URLSearchParams(location.search),
      location.hash,
      { a: 10 },
    ]);
  }),
);
 */
