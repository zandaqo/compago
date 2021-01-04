interface IRouteEvent {
  route: string;
  params?: Record<string, string>;
  query?: URLSearchParams;
  hash: string;
}

export class RouteEvent extends CustomEvent<IRouteEvent> {
  static readonly eventName = 'route';
  constructor(detail: IRouteEvent) {
    super(RouteEvent.eventName, { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface ElementEventMap {
    route: RouteEvent;
  }
}
