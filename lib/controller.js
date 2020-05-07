import { LitElement } from 'lit-element/lit-element.js';

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 * @extends LitElement
 */
class Controller extends LitElement {
  /**
   * Handles one-way binding to model or controller properties.
   *
   * @param {Event} event
   * @returns {void}
   */
  bond(event) {
    const { target } = event;
    if (!target.binding) throw TypeError('No binding configuration found.');
    const { value = 'value', property, parse, prevent } = target.binding;
    if (prevent) event.preventDefault();
    let path = property;
    const content = typeof parse === 'function' ? parse(target[value]) : target[value];
    const isOwnAttribute = path[0] !== ':';
    if (isOwnAttribute) {
      this.setAttribute(path, content);
      return;
    }
    path = path.slice(1);
    const isNested = path.includes('.');
    if (!isNested) {
      this.model[path] = content;
      return;
    }

    let { model } = this;
    const chunks = path.split('.');
    const field = chunks[chunks.length - 1];
    for (let i = 0; i < chunks.length - 1; i += 1) {
      model = model[chunks[i]];
    }
    if (model) model[field] = content;
  }

  /**
   * Saves a URL from the event target's href into the browser history.
   *
   * @param {Event} event
   * @returns {void}
   */
  static navigate(event) {
    const { target } = event;
    // allow storing the URL in data-href attribute as well
    const path = target.href || target.getAttribute('data-href');
    if (!path) return;
    event.preventDefault();
    globalThis.history.pushState({}, globalThis.document.title, path);
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
   * Prepares the controller for removal by detaching it from its model.
   *
   * @returns {void}
   */
  dispose() {
    const { translator } = this.constructor;
    if (translator) {
      translator.removeEventListener('language', this.onLanguageChange);
    }

    if (this.model) {
      this.model.removeEventListener('change', this.onModelChange);
      this.model = undefined;
    }
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
      this.onLanguageChange = this.onLanguageChange.bind(this);
      translator.addEventListener('language', this.onLanguageChange);
    }

    // listen to model changes if it's present
    if (this.model) {
      this.onModelChange = this.onModelChange.bind(this);
      this.model.addEventListener('change', this.onModelChange);
    }
  }

  /**
   * Invoked once the controller is detached from the DOM.
   * By default, disposes of the controller.
   * @returns {undefined}
   */
  disconnectedCallback() {
    this.dispose();
    super.disconnectedCallback();
  }

  async onLanguageChange() {
    await this.requestUpdate();
  }

  /**
   * @param {string} key
   * @param {Object} interpolation
   * @returns {string}
   */
  static translate(key, interpolation) {
    return this.translator.translate(this.translations, key, interpolation, this.name);
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

export default Controller;
