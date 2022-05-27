import { LitElement, PropertyDeclaration } from "./deps.ts";
import { Observable, ObservedValue, sObservable, sPath } from "./observable.ts";
import type { ChangeEvent } from "./change-event.ts";

export abstract class ObserverElement extends LitElement {
  #observables = new Map<PropertyKey, (event: ChangeEvent) => void>();

  constructor() {
    super();
    const properties =
      (this.constructor as typeof ObserverElement).elementProperties;
    if (properties) {
      for (const [name, options] of properties.entries()) {
        if (options.type === Observable) {
          this.#observables.set(
            name,
            this.onObservableChange.bind(this, name),
          );
        }
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const property of this.#observables.keys()) {
      const observable =
        (this as unknown as { [key: PropertyKey]: ObservedValue })[property];
      if (observable) {
        observable[sObservable].removeEventListener(
          "change",
          this.#observables.get(property)!,
        );
      }
    }
  }

  onObservableChange(property: PropertyKey, event: ChangeEvent): void {
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

  static createProperty(name: PropertyKey, options?: PropertyDeclaration) {
    if (options?.type === Observable) {
      // @ts-ignore 2540
      options.attribute = false;
    }
    super.createProperty(name, options);
  }

  static getPropertyDescriptor(
    name: string,
    key: string | symbol,
    options: PropertyDeclaration,
  ): ReturnType<typeof LitElement.getPropertyDescriptor> {
    if (options.type !== Observable) {
      return super.getPropertyDescriptor(name, key, options);
    }
    return {
      get(): ObservedValue {
        return (this as unknown as { [key: string]: ObservedValue })[
          key as string
        ];
      },

      set(this: ObserverElement, value: ObservedValue) {
        const oldValue =
          (this as unknown as { [key: PropertyKey]: ObservedValue })[name];
        if (oldValue === value) return;
        const handler = this.#observables.get(name)!;
        if (oldValue && oldValue[sObservable]) {
          oldValue[sObservable].removeEventListener("change", handler);
        }
        if (value && value[sObservable]) {
          value[sObservable].addEventListener("change", handler);
        }
        (this as unknown as { [key: string]: unknown })[key as string] = value;
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true,
    };
  }
}
