import { LitElement } from 'lit-element/lit-element.js';
import { directive } from 'lit-html';

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
    this[Symbol.for('c_model')] = model;
  }

  /**
   * @type {Model|ModelArray}
   */
  get model() {
    return this[Symbol.for('c_model')];
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
   * Saves a URL from the event target's href into the browser history.
   *
   * @param {Event} event
   * @returns {void}
   */
  static navigate(event) {
    const { currentTarget } = event;
    // allow storing the URL in data-href attribute as well
    const path = currentTarget.href || currentTarget.getAttribute('data-href');
    if (!path) return;
    event.preventDefault();
    globalThis.history.pushState({}, globalThis.document.title, path);
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * @type {Translator}
   */
  static get translator() {
    return globalThis[Symbol.for('compago-translator')];
  }
}

/**
 * @type {Translations}
 */
Controller.translations = {};

/**
 * Handles one-way binding to model or controller properties.
 *
 * @param {Event} event
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
    !recipient
      ? undefined
      : (event) => {
          if (prevent) event.preventDefault();
          if (!recipient) return;
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

Controller.translate = directive((ctor, key, interpolation) => (part) => {
  const { translator, translations, name } = ctor;
  if (!translator) return;
  const translation = translator.translate(translations, key, interpolation, name);
  part.setValue(translation);
});
