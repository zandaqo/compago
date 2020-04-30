/**
 * @private
 * @type {symbol}
 */
const listener = Symbol.for('c_listener');

/**
 * A polyfill for extending EventTarget.
 *
 * @param {class} Base the base class to extend
 * @returns {class} a class to extend to get EventTarget
 *
 * @private
 */
export default (Base = Object) => {
  // if Base class inherits from EventTarget return the Base class
  if (Base.prototype instanceof EventTarget) return Base;
  // if no Base class is provided return EventTarget
  if (Base === Object) return EventTarget;
  // in any other case use a polyfill
  return class extends Base {
    constructor() {
      super();
      Object.defineProperty(this, listener, {
        value: new EventTarget(),
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }

    addEventListener(...args) {
      return this[listener].addEventListener(...args);
    }

    removeEventListener(...args) {
      return this[listener].removeEventListener(...args);
    }

    dispatchEvent(...args) {
      return this[listener].dispatchEvent(...args);
    }
  };
};
