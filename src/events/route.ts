interface IRouteEvent {
  route: string;
  params: Record<string, string>;
  query?: URLSearchParams;
  hash?: string;
}

export class RouteEvent extends CustomEvent<IRouteEvent> {
  static create(detail: IRouteEvent) {
    return new this('route', { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    route: RouteEvent;
  }
}
