import { LitElement } from "lit-element";
import type { Observable } from "./observable.ts";
import { isBound } from "./utilities.ts";
import { ChangeEvent } from "./change-event.ts";

const sObservable = Symbol.for("c-observable");

// deno-lint-ignore ban-types
export class Component<T extends object = object> extends LitElement {
  [sObservable]?: Observable<T>;

  /**
   * The component's model
   */
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

  /**
   * Handles `change` events of the component's model.
   */
  onModelChange(_: ChangeEvent): void {
    this.requestUpdate();
  }
}
