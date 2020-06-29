import { LitElement } from 'lit-element/lit-element.js';
import { directive } from 'lit-html';

/**
 * @typedef {Object} ControllerBond
 * @property {string} to
 * @property {Function} [parse]
 * @property {boolean} [prevent]
 * @property {string} [property]
 * @property {string} [attribute]
 * @property {*} [value]
 */

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 * @extends LitElement
 */
export default class Controller extends LitElement {
  constructor() {
    super();
    this.onModelChange = this.onModelChange.bind(this);
    this.onLanguageChange = this.onLanguageChange.bind(this);
  }

  /**
   * Handles `change` events of the controller's model.
   *
   * @returns {void}
   */
  async onModelChange() {
    await this.requestUpdate();
  }

  /**
   * Invoked once the controller is attached to the DOM.
   * By default, controller starts observing attributes of its model.
   * @returns {undefined}
   */
  connectedCallback() {
    super.connectedCallback();
    const { translator } = this.constructor;
    if (translator) {
      translator.addEventListener('language', this.onLanguageChange);
    }
  }

  /**
   * @param {Model|ModelArray} model
   * @returns {void}
   */
  set model(model) {
    const oldModel = this.model;
    if (oldModel === model) return;
    if (oldModel) {
      oldModel.removeEventListener('change', this.onModelChange);
    }
    if (model) {
      model.addEventListener('change', this.onModelChange);
      this.requestUpdate();
    }
    this[Symbol.for('c-model')] = model;
  }

  /**
   * @type {Model|ModelArray}
   */
  get model() {
    return this[Symbol.for('c-model')];
  }

  /**
   * Invoked once the controller is detached from the DOM.
   * By default, disposes of the controller.
   * @returns {undefined}
   */
  disconnectedCallback() {
    const { translator } = this.constructor;
    if (translator) {
      translator.removeEventListener('language', this.onLanguageChange);
    }
    if (this.model) this.model = undefined;
    super.disconnectedCallback();
  }

  async onLanguageChange() {
    await this.requestUpdate();
  }

  /**
   * @type {Translator}
   */
  static get translator() {
    return globalThis[Symbol.for('c-translator')];
  }

  /**
   * @param {string} key
   * @param {*} [interpolation]
   * @returns {string}
   */
  static translate(key, interpolation) {
    const { translator, translations, name } = this;
    return translator ? translator.translate(translations, key, interpolation, name) : key;
  }
}

/**
 * @type {Translations}
 */
Controller.translations = {};

/**
 * Handles one-way binding to model or controller properties.
 *
 * @param {ControllerBond} binding
 * @returns {void}
 */
Controller.bond = directive((binding) => (part) => {
  const { to, parse, prevent, property = 'value', attribute, value } = binding;
  let path = to;
  let recipient = part.eventContext;
  if (path[0] === ':') {
    recipient = part.eventContext.model;
    path = path.slice(1);
  }
  if (path.includes('.')) {
    const chunks = path.split('.');
    path = chunks[chunks.length - 1];
    for (let i = 0; i < chunks.length - 1; i += 1) {
      recipient = recipient[chunks[i]];
    }
  }

  part.setValue(
    !recipient || !path
      ? undefined
      : (event) => {
          if (prevent) event.preventDefault();
          let content = Reflect.has(binding, 'value')
            ? value
            : attribute != null
            ? part.element.getAttribute(attribute)
            : part.element[property];
          if (typeof parse === 'function') content = parse(content);
          recipient[path] = content;
        },
  );
});

/**
 * Saves a URL from the event target's href into the browser history.
 *
 * @param {string} [href]
 * @returns {void}
 */
Controller.navigate = directive((href) => (part) => {
  const path = href || part.element.href;
  part.setValue(
    path
      ? (event) => {
          event.preventDefault();
          globalThis.history.pushState({}, globalThis.document.title, path);
          globalThis.dispatchEvent(new PopStateEvent('popstate'));
        }
      : undefined,
  );
});

/**
 * @param {Class<Controller>} ctor
 * @param {string} key
 * @param {*} [interpolation]
 * @returns {void}
 */
Controller.ts = directive((ctor, key, interpolation) => (part) => {
  part.setValue(ctor.translate(key, interpolation));
});
