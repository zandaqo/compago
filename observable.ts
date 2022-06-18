export const sPath = Symbol.for("c-path");
export const sObservable = Symbol.for("c-observable");

export interface ObservedValue {
  [sPath]: string;
  [sObservable]: _Observable;
  [key: PropertyKey]: unknown;
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

export const ChangeType = {
  Set: "SET",
  Delete: "DELETE",
  Add: "ADD",
  Remove: "REMOVE",
  Sort: "SORT",
} as const;

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];

/**
 * The change event is fired by an observable when any change happens to the observable.
 */
export class ChangeEvent extends Event {
  constructor(
    public path: string,
    public kind: ChangeType,
    public previous?: unknown,
    public elements?: unknown,
  ) {
    super("change", { bubbles: true, composed: true });
  }
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
  declare [sPath]: string;
  declare [sObservable]: _Observable;

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
   * @param properties initial data for the observable
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
    for (const key of Object.keys(this) as Array<keyof this>) {
      if (!Reflect.has(properties, key)) delete this[key];
    }
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
    for (const key of Object.keys(source) as Array<keyof typeof source>) {
      const current = source[key];
      const existing = target[key];
      // deno-lint-ignore no-explicit-any
      (target as any)[key] = _Observable.isObjectObservable(existing) &&
          _Observable.isObjectObservable(current)
        ? this.merge(current, existing)
        : (target[key] = current);
    }
    return target;
  }

  /**
   * Returns a copy of the observable for JSON stringification.
   */
  toJSON() {
    return { ...this };
  }

  /**
   * Checks whether a value can become an observable.
   */
  static isObjectObservable(value: unknown): boolean {
    const type = Object.prototype.toString.call(value);
    return type === "[object Object]" || type === "[object Array]";
  }

  /**
   * Checks two values for 'deep' equality.
   *
   * Adopted from [fast-deep-equal]{@link https://github.com/epoberezkin/fast-deep-equal/}
   * written by Evgeny Poberezkin
   */
  static isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor) return false;

      let length, i;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != (b as Array<unknown>).length) return false;
        for (i = length; i-- !== 0;) {
          if (!this.isEqual(a[i], (b as Array<unknown>)[i])) return false;
        }
        return true;
      }

      if (a.constructor === RegExp) {
        return (a as RegExp).source === (b as RegExp).source &&
          (a as RegExp).flags === (b as RegExp).flags;
      }
      if (a.valueOf !== Object.prototype.valueOf) {
        return a.valueOf() === b.valueOf();
      }
      if (a.toString !== Object.prototype.toString) {
        return a.toString() === b.toString();
      }

      const keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length) return false;

      for (i = length; i-- !== 0;) {
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
      }

      for (i = length; i-- !== 0;) {
        const key = keys[i];
        if (!this.isEqual(a[key as keyof typeof a], b[key as keyof typeof b])) {
          return false;
        }
      }

      return true;
    }

    // true if both NaN, false otherwise
    return a !== a && b !== b;
  }

  /**
   * Sets up Proxy objects on an observable to monitor changes.
   * @param target the target object to watch for the new Proxy
   * @param path the string path to the object in the observable
   * @param observable the observable to which the proxy should belong
   * @param processed an array of already processed objects
   * @returns a new Proxy object
   */
  static getProxy(
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
        writable: true,
      });
      Reflect.defineProperty(proxy, sPath, {
        value: path,
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

  static setProxies<T extends object>(
    target: T,
    path: string,
    observable: _Observable,
    processed: Array<unknown>,
  ): void {
    const keys = Object.keys(target) as Array<keyof T>;
    for (const key of keys) {
      if (
        _Observable.isObjectObservable(target[key]) &&
        !processed.includes(target[key])
      ) {
        processed.push(target[key]);
        target[key] = this.getProxy(
          target[key],
          `${path}.${key as string}`,
          observable,
          processed,
        );
      }
    }
  }

  static arrayGetTrap<T extends ObservedValue>(
    target: T,
    property: keyof T,
    receiver: ObservedValue,
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

  static setTrap<T extends ObservedValue>(
    target: T,
    property: keyof T,
    value: unknown,
    receiver: unknown,
  ): boolean {
    // do not track symbols or non-enumerable properties
    if (
      typeof property === "symbol" ||
      (Reflect.has(target, property) &&
        !Object.prototype.propertyIsEnumerable.call(target, property))
    ) {
      Reflect.set(target, property, value, receiver);
      return true;
    }
    if (_Observable.isEqual(target[property], value)) return true;
    const path: string = target[sPath];
    const observable: _Observable = target[sObservable];
    const previous = target[property];
    const propertyPath = `${path}.${property as string}`;
    target[property] = _Observable.isObjectObservable(value)
      ? _Observable.getProxy(value, propertyPath, observable, [value])
      : value;
    observable.dispatchEvent(
      new ChangeEvent(propertyPath, ChangeType.Set, previous),
    );
    return true;
  }

  static deletePropertyTrap<T extends ObservedValue>(
    target: T,
    property: keyof T,
  ) {
    if (!Reflect.has(target, property)) return true;
    if (
      typeof property === "symbol" ||
      !Object.prototype.propertyIsEnumerable.call(target, property)
    ) {
      delete target[property];
      return true;
    }
    const path = target[sPath];
    const observable = target[sObservable];
    const previous = target[property];
    const propertyPath = `${path}.${property as string}`;
    delete target[property];
    observable.dispatchEvent(
      new ChangeEvent(propertyPath, ChangeType.Delete, previous),
    );
    return true;
  }
}

export type Observable<K extends object> = _Observable<K> & K;

export const Observable = _Observable as {
  new <T extends object>(properties: T): Observable<T>;
};
