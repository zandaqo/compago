import { LitElement } from "./deps.ts";
import type { Observable } from "./observable.ts";
import type { ChangeEvent } from "./change-event.ts";

const sObservable = Symbol.for("c-observable");

// deno-lint-ignore ban-types
export abstract class ObserverElement<T extends object> extends LitElement {
  [sObservable]?: Observable<T>;
  get $() {
    return this[sObservable];
  }

  set $(value) {
    const old = this.$;
    if (old === value) return;
    if (old) old.removeEventListener("change", this.onObservableChange);
    if (value) {
      value.addEventListener("change", this.onObservableChange);
      this.requestUpdate();
    }
    this[sObservable] = value;
  }

  disconnectedCallback(): void {
    if (this.$) this.$ = undefined;
    super.disconnectedCallback();
  }

  onObservableChange = (_event: ChangeEvent) => {
    this.requestUpdate();
  };
}
