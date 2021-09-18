export class RouteEvent extends Event {
  constructor(
    public route: string,
    public params: Record<string, string>,
    public query?: URLSearchParams,
    public hash?: string,
    public state?: unknown,
  ) {
    super("route", { bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    route: RouteEvent;
  }
}
