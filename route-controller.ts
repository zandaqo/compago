import type {
  ReactiveController,
  ReactiveControllerHost,
} from "@lit/reactive-element";
import { RouteEvent } from "./route-event.ts";

export type RouteHandler = (
  name: string,
  params: Record<string, string>,
  query?: URLSearchParams,
  hash?: string,
  state?: unknown,
) => void;

export type RouteMap = Record<string, [RegExp, RouteHandler | undefined]>;

export class RouteController implements ReactiveController {
  host: ReactiveControllerHost;
  root = "";
  current = "";
  routes: RouteMap;
  constructor(host: ReactiveControllerHost, routes: RouteMap, root = "") {
    (this.host = host).addController(this);
    this.routes = routes;
    this.root = root;
    this.onPopstate = this.onPopstate.bind(this);
  }

  onPopstate(event: PopStateEvent): void {
    const { root, routes } = this;
    const { location } = globalThis;
    let path = decodeURIComponent(location.pathname);
    if (path === this.current) return;
    this.current = path;
    if (root && !path.startsWith(root)) return;
    path = path.slice(root.length);
    const names = Object.keys(routes);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      const [route, handler] = routes[name];
      const match = route.exec(path);
      if (!match) continue;
      const params = match.groups || {};
      const hash = decodeURIComponent(location.hash);
      const query = location.search
        ? new URLSearchParams(location.search)
        : undefined;
      if (handler) {
        handler.call(this.host, name, params, query, hash, event.state);
      }
      (this.host as unknown as HTMLElement).dispatchEvent(
        new RouteEvent(name, params, query, hash, event.state),
      );
      return;
    }
  }

  hostConnected() {
    globalThis.addEventListener("popstate", this.onPopstate);
  }

  hostDisconnected() {
    globalThis.removeEventListener("popstate", this.onPopstate);
  }
}
