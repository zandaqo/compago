type RouteEventDetail = {
  route: string;
  params: Record<string, string>;
  query?: URLSearchParams;
  hash?: string;
  state?: any;
};

export class RouteEvent extends CustomEvent<RouteEventDetail> {
  static create(detail: RouteEventDetail) {
    return new this('route', { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    route: RouteEvent;
  }
}
