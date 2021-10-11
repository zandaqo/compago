// deno-lint-ignore-file ban-types
import { ChangeEvent, ChangeType } from "./change-event.ts";
import { isEqual, isObservableObject } from "./utilities.ts";

const sPath = Symbol.for("c-path");
const sObservable = Symbol.for("c-observable");

interface Observed {
  [sPath]: string;
  [sObservable]: _Observable;
}

const watchedArrayMethods = new Set([
  "push",
  "pop",
  "unshift",
  "shift",
  "splice",
  "sort",
]);

interface ObservableEventMap {
  change: ChangeEvent;
}

export interface _Observable {
  addEventListener<K extends keyof ObservableEventMap>(
    type: K,
    listener: (this: _Observable, ev: ObservableEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof ObservableEventMap>(
    type: K,
    listener: (this: _Observable, ev: ObservableEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export class _Observable<T extends object = object> extends EventTarget {
  [sPath]?: string;
  [sObservable]?: _Observable;

  static readonly arrayHandler: ProxyHandler<object> = {
    get: _Observable.arrayGetTrap,
    set: _Observable.setTrap,
    deleteProperty: _Observable.deletePropertyTrap,
  };

  static readonly handler: ProxyHandler<object> = {
    set: _Observable.setTrap,
    deleteProperty: _Observable.deletePropertyTrap,
  };

  /**
   * @param properties
   */
  constructor(properties: T) {
    super();
    Reflect.defineProperty(this, "addEventListener", {
      value: this.addEventListener.bind(this),
      writable: true,
    });
    Reflect.defineProperty(this, "removeEventListener", {
      value: this.removeEventListener.bind(this),
      writable: true,
    });
    Reflect.defineProperty(this, "dispatchEvent", {
      value: this.dispatchEvent.bind(this),
      writable: true,
    });
    this.assign(properties);
    return _Observable.getProxy(this, "", this, [this]);
  }

  /**
   * Resets all properties on the observable with given ones.
   *
   * @param properties the properties to be set on the observable
   */
  set(properties: T): this {
    Object.keys(this).forEach((key) => {
      if (!Reflect.has(properties, key)) delete this[key as keyof this];
    });
    return Object.assign(this, properties);
  }

  /**
   * Assigns given properties to the observable.
   *
   * @param {Object} properties the properties to be assigned to the observable
   */
  assign(properties: Partial<T>) {
    return Object.assign(this, properties);
  }

  /**
   * Merges two objects. If no target object provided, merges a given source object with the observable.
   *
   * @param source the source object to be merged with the target object.
   * @param target the target object to be merged, uses the observable by default
   */
  merge(source: object, target: object = this): object {
    (Object.keys(source) as Array<keyof typeof source>).forEach((key) => {
      const current = source[key];
      const existing = target[key];
      // deno-lint-ignore no-explicit-any
      (target as any)[key] =
        isObservableObject(existing) && isObservableObject(current)
          ? this.merge(current, existing)
          : (target[key] = current);
    });
    return target;
  }

  /**
   * Returns a copy of the observable for JSON stringification.
   */
  toJSON() {
    return { ...this };
  }

  /**
   * Sets up Proxy objects on an observable to monitor changes.
   * @param target the target object to watch for the new Proxy
   * @param path the string path to the object in the observable
   * @param observable the observable to which the proxy should belong
   * @param processed an array of already processed objects
   * @returns a new Proxy object
   */
  private static getProxy(
    // deno-lint-ignore no-explicit-any
    target: any,
    path: string,
    observable: _Observable,
    processed: Array<unknown>,
  ) {
    let proxy;
    // if the target already has a proxy
    if (target[sObservable]) {
      proxy = target;
      proxy[sObservable] = observable;
      proxy[sPath] = path;
    } else {
      const handler = Array.isArray(target) ? this.arrayHandler : this.handler;
      proxy = new Proxy(target, handler);
      Reflect.defineProperty(proxy, sObservable, {
        value: observable,
        configurable: true,
        writable: true,
      });
      Reflect.defineProperty(proxy, sPath, {
        value: path,
        configurable: true,
        writable: true,
      });
      if (target === observable) {
        target[sObservable] = proxy;
        observable = proxy;
      }
    }

    this.setProxies(target, path, observable, processed);
    return proxy;
  }

  private static setProxies<T extends object>(
    target: T,
    path: string,
    observable: _Observable,
    processed: Array<unknown>,
  ): void {
    const keys = Object.keys(target) as Array<keyof T>;
    for (const key of keys) {
      if (isObservableObject(target[key]) && !processed.includes(target[key])) {
        processed.push(target[key]);
        target[key] = this.getProxy(
          target[key],
          `${path}:${key}`,
          observable,
          processed,
        );
      }
    }
  }

  private static arrayGetTrap<T extends Observed>(
    target: T,
    property: keyof T,
    receiver: Observed,
  ): unknown {
    if (typeof property === "string" && watchedArrayMethods.has(property)) {
      return (...args: unknown[]) => {
        // deno-lint-ignore no-explicit-any
        const value = (target[property] as any)(...args);
        _Observable.setProxies(target, receiver[sPath], receiver[sObservable], [
          receiver,
        ]);
        switch (property) {
          case "push":
          case "unshift":
            target[sObservable].dispatchEvent(
              new ChangeEvent(target[sPath], ChangeType.Add, undefined, args),
            );
            break;
          case "shift":
          case "pop":
            target[sObservable].dispatchEvent(
              new ChangeEvent(
                target[sPath],
                ChangeType.Remove,
                undefined,
                value,
              ),
            );
            break;
          case "splice":
            target[sObservable].dispatchEvent(
              new ChangeEvent(
                target[sPath],
                ChangeType.Remove,
                undefined,
                value,
              ),
            );
            if (args.length > 2) {
              target[sObservable].dispatchEvent(
                new ChangeEvent(
                  target[sPath],
                  ChangeType.Add,
                  undefined,
                  args.slice(2),
                ),
              );
            }
            break;
          case "sort":
            target[sObservable].dispatchEvent(
              new ChangeEvent(target[sPath], ChangeType.Sort),
            );
            break;
        }
        return value;
      };
    }
    return target[property];
  }

  private static setTrap<T extends Observed>(
    target: T,
    property: keyof T,
    value: unknown,
    receiver: unknown,
  ): boolean {
    // do not track symbols or non-enumerable properties
    if (
      typeof property === "symbol" ||
      // deno-lint-ignore no-prototype-builtins
      (Reflect.has(target, property) && !target.propertyIsEnumerable(property))
    ) {
      Reflect.set(target, property, value, receiver);
      return true;
    }
    if (isEqual(target[property], value)) return true;
    const path: string = target[sPath];
    const observable: _Observable = target[sObservable];
    const previous = target[property];
    const propertyPath = `${path}:${property}`;
    target[property] = isObservableObject(value)
      ? _Observable.getProxy(value, propertyPath, observable, [value])
      : value;
    observable.dispatchEvent(
      new ChangeEvent(propertyPath, ChangeType.Set, previous),
    );
    return true;
  }

  private static deletePropertyTrap<T extends Observed>(
    target: T,
    property: keyof T,
  ) {
    if (!Reflect.has(target, property)) return true;
    if (
      typeof property === "symbol" ||
      // deno-lint-ignore no-prototype-builtins
      !target.propertyIsEnumerable(property)
    ) {
      delete target[property];
      return true;
    }
    const path = target[sPath];
    const observable = target[sObservable];
    const previous = target[property];
    const propertyPath = `${path}:${property}`;
    delete target[property];
    observable.dispatchEvent(
      new ChangeEvent(propertyPath, ChangeType.Delete, previous),
    );
    return true;
  }
}

export type Observable<K extends object> = _Observable<K> & K;

export const Observable = _Observable as {
  new <T extends object>(data: T): _Observable<T> & T;
};
