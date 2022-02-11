// deno-lint-ignore-file ban-types
import { ChangeEvent } from "./change-event.ts";
import type { ReactiveController, ReactiveControllerHost } from "./deps.ts";
import { _Observable } from "./observable.ts";

const sHost = Symbol.for("c-observable-host");

export class _ObservableController<T extends object> extends _Observable<T>
  implements ReactiveController {
  [sHost]: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    properties: T = {} as T,
    onchange?: (event: ChangeEvent) => void,
  ) {
    super(properties);
    if (onchange) this.onObservableChange = onchange;
    (this[sHost] = host).addController(this);
  }

  hostConnected() {
    this.addEventListener("change", this.onObservableChange);
  }

  hostDisconnected() {
    this.removeEventListener("change", this.onObservableChange);
  }

  onObservableChange = (_event: ChangeEvent) => {
    this[sHost].requestUpdate();
  };
}

export type ObservableController<K extends object> =
  & _ObservableController<K>
  & K;

export const ObservableController = _ObservableController as {
  new <T extends object>(
    host: ReactiveControllerHost,
    properties?: T,
    onchange?: (event: ChangeEvent) => void,
  ): _ObservableController<T> & T;
};
