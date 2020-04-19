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
  if (EventTarget.prototype.isPrototypeOf(Base.prototype)) return Base;
  // if no Base class is provided return EventTarget
  if (Base === Object) return EventTarget;
  // in any other case use a polyfill
  return class extends Base {
    constructor() {
      super();
      Object.defineProperty(this, Symbol.for('c_fragment'), {
        value: new EventTarget(),
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }

    addEventListener(...args) {
      return this[Symbol.for('c_fragment')].addEventListener(...args);
    }

    removeEventListener(...args) {
      return this[Symbol.for('c_fragment')].removeEventListener(...args);
    }

    dispatchEvent(...args) {
      return this[Symbol.for('c_fragment')].dispatchEvent(...args);
    }
  };
};
