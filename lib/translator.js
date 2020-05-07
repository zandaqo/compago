/** @typedef {Object<string, Object<string, Object<string, string> | string>>} Translations */

/**
 * @typedef TranslatorOptions
 * @property {string} [language]
 * @property {Array<string>} languages
 * @property {Translations} [translations]
 * @property {string} [globalPrefix=$]
 */

/**
 * @extends {EventTarget}
 */
class Translator extends EventTarget {
  /**
   * @param {TranslatorOptions} options
   */
  constructor(options) {
    const { language, languages, translations = {}, globalPrefix = '$' } = options;
    super();
    this.languages = languages;
    this.translations = languages.reduce((a, i) => {
      a[i] = translations[i] || {};
      return a;
    }, {});
    this.globalPrefix = globalPrefix;
    this.language = undefined;
    this.pluralRules = undefined;
    this.setLanguage(language || this.getLanguage());
  }

  /**
   * @param {string} language
   * @returns {void}
   */
  setLanguage(language) {
    const hasChanged = this.language !== language;
    this.language = language;
    this.pluralRules = new Intl.PluralRules(language);
    if (hasChanged) {
      this.dispatchEvent(new CustomEvent('language', { bubbles: true, composed: true }));
    }
  }

  /**
   * @param {string} language
   * @returns {string}
   */
  getLanguage(language = globalThis.navigator.language) {
    const { languages } = this;
    // perfect match
    if (languages.includes(language)) return language;
    // language tag match
    const [tag] = language.split('-');
    if (tag && languages.includes(tag)) return tag;
    return languages[0];
  }

  /**
   * Noop
   *
   * @param {string} componentName
   * @param {string} key
   * @param {string} [rule]
   * @returns {void}
   */
  reportMissing(componentName, key, rule) {
    this.dispatchEvent(
      new CustomEvent('missing', {
        detail: { componentName, key, rule },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * @param {Translations} translations
   * @param {string} key
   * @param {Object} [interpolation]
   * @param {string} [componentName]
   * @returns {string}
   */
  translate(translations, key, interpolation, componentName) {
    const { language, globalPrefix } = this;
    // use global store if prefix found
    const resources = !key.startsWith(globalPrefix)
      ? translations[language]
      : this.translations[language];
    let translation = resources[key];
    let rule = '';

    if (translation) {
      if (!interpolation) return translation;
      if (typeof interpolation.count === 'number') {
        rule = this.pluralRules.select(interpolation.count);
        // use 'other' if translation for the rule is not found
        translation = translation[rule] || translation.other;
      }
    }

    if (!translation) {
      this.reportMissing(componentName, key, rule);
      return '';
    }

    return this.constructor.interpolate(translation, interpolation);
  }

  /**
   * @param {TranslatorOptions} options
   * @param {symbol} symbol
   * @returns {Translator}
   */
  static initialize(options, symbol = Symbol.for('compago-translator')) {
    const translator = new Translator(options);
    globalThis[symbol] = translator;
    return translator;
  }

  /**
   * @param {string} text
   * @param {Object} interpolation
   * @returns {string}
   */
  static interpolate(text, interpolation) {
    return text.replace(/{{(\w+)}}/gi, (m, param) =>
      Reflect.has(interpolation, param) ? interpolation[param] : '',
    );
  }
}

export default Translator;
