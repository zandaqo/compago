import type { ReactiveElement } from "@lit/reactive-element";
import { isBound } from "./utilities.ts";
import type { Observable } from "./observable.ts";
import type { ChangeEvent } from "./change-event.ts";

const sObservable = Symbol.for("c-observable");

type Constructor<T> = { new (...args: any[]): T };

export interface Observer<T extends object> {
  model?: Observable<T>;
  onModelChange(event: ChangeEvent): void;
}

export function Observing<
  T extends object,
  U extends Constructor<ReactiveElement> = Constructor<ReactiveElement>,
>(Base: U): Constructor<Observer<T>> & U {
  return class Observer extends Base {
    [sObservable]?: Observable<T>;
    get model() {
      return this[sObservable];
    }

    set model(model) {
      const oldModel = this.model;
      if (oldModel === model) return;
      if (oldModel) {
        oldModel.removeEventListener("change", this.onModelChange);
      }
      if (model) {
        if (!isBound(this.onModelChange)) {
          this.onModelChange = this.onModelChange.bind(this);
        }
        model.addEventListener("change", this.onModelChange);
        this.requestUpdate();
      }
      this[sObservable] = model;
    }

    disconnectedCallback(): void {
      if (this.model) this.model = undefined;
      super.disconnectedCallback();
    }

    onModelChange(_: ChangeEvent): void {
      this.requestUpdate();
    }
  };
}
