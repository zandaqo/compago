export type RouteDetail<T = Record<string, string>> = {
  name: string;
  params: T;
};

export class RouteEvent<T = Record<string, string>> extends Event {
  constructor(
    public detail: RouteDetail<T>,
  ) {
    super("route", { bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    route: RouteEvent;
  }
}
