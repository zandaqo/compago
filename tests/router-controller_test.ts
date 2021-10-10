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
