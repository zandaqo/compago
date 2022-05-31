import { LitElement } from "./deps.ts";
import { ObservedValue, sObservable, sPath } from "./observable.ts";
import type { ChangeEvent } from "./observable.ts";
import { Constructor } from "./interfaces.ts";

const sHandlers = Symbol.for("c-handlers");
const sObservables = Symbol.for("c-observables");

export function ObserverElement<U extends Constructor<LitElement>>(
  Base: U,
) {
  return class ObserverElement extends Base {
    [sObservables] = new Map<PropertyKey, ObservedValue>();
    [sHandlers] = new Map<PropertyKey, (event: ChangeEvent) => void>();
    declare static observables: Array<PropertyKey>;

    // deno-lint-ignore no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const { observables } = this
        .constructor as typeof ObserverElement;
      if (observables) {
        for (const property of observables) {
          this.setObservable(property);
        }
      }
    }

    onObservableChange(
      property: PropertyKey,
      event: ChangeEvent,
    ): void {
      const pathPrefix: string =
        (this as unknown as { [key: PropertyKey]: ObservedValue })[property][
          sPath
        ];
      if (event.path.startsWith(pathPrefix)) {
        const elementPath = `${property as string}${
          event.path.slice(pathPrefix.length)
        }`;
        this.requestUpdate(elementPath, event);
      }
    }

    setObservable(
      property: PropertyKey,
    ) {
      const value =
        (this as unknown as { [key: PropertyKey]: ObservedValue })[property];
      Object.defineProperty(this, property, {
        get(this: ObserverElement): ObservedValue | undefined {
          return this[sObservables].get(property);
        },
        set(this: ObserverElement, value: ObservedValue) {
          const oldValue = this[sObservables].get(property);
          if (oldValue === value) return;
          if (!this[sHandlers].has(property)) {
            this[sHandlers].set(
              property,
              this.onObservableChange.bind(this, property),
            );
          }
          const handler = this[sHandlers].get(property)!;
          if (oldValue && oldValue[sObservable]) {
            oldValue[sObservable].removeEventListener("change", handler);
          }
          if (value && value[sObservable]) {
            value[sObservable].addEventListener("change", handler);
          }
          this[sObservables].set(property, value);
          this.requestUpdate(property, oldValue);
        },
        configurable: true,
        enumerable: true,
      });
      if (value) {
        (this as unknown as { [key: PropertyKey]: ObservedValue })[property] =
          value;
      }
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();
      for (const [property, observable] of this[sObservables].entries()) {
        observable[sObservable].removeEventListener(
          "change",
          this[sHandlers].get(property)!,
        );
      }
    }
  } as U;
}

export function observer() {
  return ObserverElement;
}

export function observe() {
  return function (
    // deno-lint-ignore no-explicit-any
    target: any,
    property: PropertyKey,
  ) {
    const observables = target.constructor.observables || [];
    observables.push(property);
    target.constructor.observables = observables;
  };
}
