// deno-lint-ignore-file ban-types
import type { ReactiveElement } from "./deps.ts";
import { isBound } from "./utilities.ts";
import type { Observable } from "./observable.ts";
import type { ChangeEvent } from "./change-event.ts";
import type { Constructor } from "./interfaces.ts";

const sObservable = Symbol.for("c-observable");

export interface Observer<T extends object> {
  $?: Observable<T>;
  onObservableChange(event: ChangeEvent): void;
}

export function Observing<
  T extends object,
  U extends Constructor<ReactiveElement> = Constructor<ReactiveElement>,
>(Base: U): Constructor<Observer<T>> & U {
  return class Observer extends Base {
    [sObservable]?: Observable<T>;
    get $() {
      return this[sObservable];
    }

    set $(value) {
      const old = this.$;
      if (old === value) return;
      if (old) old.removeEventListener("change", this.onObservableChange);
      if (value) {
        if (!isBound(this.onObservableChange)) {
          this.onObservableChange = this.onObservableChange.bind(this);
        }
        value.addEventListener("change", this.onObservableChange);
        this.requestUpdate();
      }
      this[sObservable] = value;
    }

    disconnectedCallback(): void {
      if (this.$) this.$ = undefined;
      super.disconnectedCallback();
    }

    onObservableChange(_event: ChangeEvent): void {
      this.requestUpdate();
    }
  };
}
