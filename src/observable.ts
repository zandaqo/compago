import { ChangeEvent, ChangeType } from './events/change';
import { isObservableObject, isEqual } from './utilities';

const sPath = Symbol.for('c-path');

export const sObservable = Symbol.for('c-observable');

const watchedArrayMethods = new Set([
  'push',
  'pop',
  'unshift',
  'shift',
  'splice',
  'sort',
]);

export class _Observable<T extends Object = Object> extends EventTarget {
  static readonly handler: ProxyHandler<any> = {
    set: _Observable.setTrap,
    deleteProperty: _Observable.deletePropertyTrap,
  };

  static readonly arrayHandler: ProxyHandler<any> = {
    get: _Observable.arrayGetTrap,
    set: _Observable.setTrap,
    deleteProperty: _Observable.deletePropertyTrap,
  };

  /**
   * @param properties
   */
  constructor(properties: T) {
    super();
    Reflect.defineProperty(this, 'addEventListener', {
      value: this.addEventListener.bind(this),
      writable: true,
    });
    Reflect.defineProperty(this, 'removeEventListener', {
      value: this.removeEventListener.bind(this),
      writable: true,
    });
    Reflect.defineProperty(this, 'dispatchEvent', {
      value: this.dispatchEvent.bind(this),
      writable: true,
    });
    this.assign(properties);
    return _Observable.getProxy(this, '', this, [this]);
  }

  /**
   * Resets all properties on the observable with given ones.
   *
   * @param properties the properties to be set on the observable
   */
  set(properties: T): this {
    Object.keys(this).forEach((key) => {
      if (!Reflect.has(properties, key)) delete (this as any)[key];
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
  merge(source: any, target: any = this) {
    Object.keys(source).forEach((key) => {
      const current = source[key];
      const existing = target[key];
      target[key] =
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
   * Emits appropriate `change` events when a given property is changed.
   */
  private static emitChange(
    observable: _Observable,
    path: string,
    type: ChangeType,
    previous?: any,
    elements?: any,
  ): void {
    observable.dispatchEvent(new ChangeEvent({ path, type, previous, elements }));
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
    target: any,
    path: string,
    observable: _Observable,
    processed: Array<any>,
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

    Object.keys(target).forEach((key) => {
      if (isObservableObject(target[key]) && !processed.includes(target[key])) {
        processed.push(target[key]);
        target[key] = this.getProxy(target[key], `${path}:${key}`, observable, processed);
      }
    });
    return proxy;
  }

  private static arrayGetTrap(target: any, property: PropertyKey): any {
    if (typeof property === 'string' && watchedArrayMethods.has(property)) {
      return (...args: any[]) => {
        const value = target[property](...args);
        switch (property) {
          case 'push':
          case 'unshift':
            _Observable.emitChange(
              target[sObservable],
              target[sPath],
              ChangeType.Add,
              undefined,
              args,
            );
            break;
          case 'shift':
          case 'pop':
            _Observable.emitChange(
              target[sObservable],
              target[sPath],
              ChangeType.Remove,
              undefined,
              value,
            );
            break;
          case 'splice':
            _Observable.emitChange(
              target[sObservable],
              target[sPath],
              ChangeType.Remove,
              undefined,
              value,
            );
            _Observable.emitChange(
              target[sObservable],
              target[sPath],
              ChangeType.Add,
              undefined,
              args.slice(2),
            );
            break;
          case 'sort':
            _Observable.emitChange(target[sObservable], target[sPath], ChangeType.Sort);
            break;
        }
        return value;
      };
    }
    return target[property];
  }

  private static setTrap(
    target: any,
    property: PropertyKey,
    value: any,
    receiver: any,
  ): boolean {
    // do not track symbols or non-enumerable properties
    if (
      typeof property === 'symbol' ||
      (Reflect.has(target, property) && !target.propertyIsEnumerable(property))
    ) {
      Reflect.set(target, property, value, receiver);
      return true;
    }
    if (isEqual(target[property], value)) return true;
    const path: string = target[sPath];
    const observable: _Observable = target[sObservable];
    const previous: any = target[property];
    const propertyPath = `${path}:${property}`;
    target[property] = isObservableObject(value)
      ? _Observable.getProxy(value, propertyPath, observable, [value])
      : value;
    _Observable.emitChange(observable, propertyPath, ChangeType.Set, previous);
    return true;
  }

  private static deletePropertyTrap(target: any, property: PropertyKey) {
    if (!Reflect.has(target, property)) return true;
    if (typeof property === 'symbol' || !target.propertyIsEnumerable(property)) {
      delete target[property];
      return true;
    }
    const path = target[sPath];
    const observable = target[sObservable];
    const previous = target[property];
    const propertyPath = `${path}:${property}`;
    delete target[property];
    _Observable.emitChange(observable, propertyPath, ChangeType.Delete, previous);
    return true;
  }
}

export type Observable<K> = _Observable<K> & K;

export const Observable = _Observable as { new <T>(data: T): _Observable<T> & T };
