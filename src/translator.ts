import { LanguageChangeEvent } from './events/language-change';
import { MissingTranslationEvent } from './events/missing-translation';

type PluralTranslation = Partial<Record<Intl.LDMLPluralRule, string>>;

export const sTranslator = Symbol.for('c-translator');

interface ITranslation {
  [key: string]:
    | string
    | Intl.DateTimeFormat
    | Intl.NumberFormat
    | Intl.RelativeTimeFormat
    | PluralTranslation;
}

export interface ITranslations {
  [language: string]: ITranslation;
}

interface ITranslatorOptions {
  language?: string;
  languages: Array<string>;
  translations: ITranslations;
  globalPrefix?: string;
}

const { PluralRules, RelativeTimeFormat } = globalThis.Intl;

/**
 *
 */
export class Translator extends EventTarget {
  language: string;
  globalPrefix: string;
  languages: Array<string>;
  translations: ITranslations;
  pluralRules: Intl.PluralRules;

  /**
   * @param options
   */
  constructor({
    language,
    languages,
    translations = {},
    globalPrefix = '$',
  }: ITranslatorOptions) {
    super();
    this.languages = languages;
    this.translations = translations;
    this.globalPrefix = globalPrefix;
    this.language = language || this.getLanguage();
    this.pluralRules = new PluralRules(this.language);
  }

  /**
   * @param language
   * @returns {void}
   */
  setLanguage(language: string): void {
    const { language: previous } = this;
    const hasChanged = previous !== language;
    this.language = language;
    this.pluralRules = new PluralRules(language);
    if (hasChanged) {
      this.dispatchEvent(new LanguageChangeEvent({ previous }));
    }
  }

  /**
   * @param language
   * @returns
   */
  getLanguage(language = globalThis.navigator.language): string {
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
   * @param component
   * @param key
   * @param rule
   * @returns {void}
   */
  reportMissing(
    component: string = this.constructor.name,
    key: string,
    rule?: string,
  ): void {
    this.dispatchEvent(new MissingTranslationEvent({ component, key, rule }));
  }

  /**
   * @param translations
   * @param key
   * @param {Object|number|Array} [interpolation]
   * @param component
   * @returns string
   */
  translate(
    translations: ITranslations,
    key: string,
    interpolation?: any,
    component?: string,
  ): string {
    const { language, globalPrefix } = this;
    // use global store if prefix found
    const resources = !key.startsWith(globalPrefix)
      ? translations[language]
      : this.translations[language];
    const translation = resources[key];

    if (translation) {
      if (!interpolation) return translation as string;
      if (typeof interpolation.count === 'number') {
        const rule: Intl.LDMLPluralRule = this.pluralRules.select(interpolation.count);
        const pluralTranslation =
          (translation as PluralTranslation)[rule] ||
          (translation as PluralTranslation).other;
        if (typeof pluralTranslation !== 'undefined') {
          return (this.constructor as typeof Translator).interpolate(
            pluralTranslation,
            interpolation,
          );
        } else {
          this.reportMissing(component, key, rule);
          return '';
        }
      }
      if (typeof translation === 'string') {
        return (this.constructor as typeof Translator).interpolate(
          translation,
          interpolation,
        );
      }
      if (Reflect.has(translation, 'format')) {
        if (translation instanceof RelativeTimeFormat) {
          return translation.format(interpolation[0], interpolation[1]);
        }
        return (translation as Intl.DateTimeFormat | Intl.NumberFormat).format(
          interpolation,
        );
      }
    }
    this.reportMissing(component, key);
    return '';
  }

  /**
   * @param options
   * @param symbol
   * @returns
   */
  static initialize(options: ITranslatorOptions, symbol = sTranslator): Translator {
    const translator = new Translator(options);
    (globalThis as any)[symbol] = translator;
    return translator;
  }

  /**
   * @param {string} text
   * @param {Object} interpolation
   * @returns {string}
   */
  static interpolate(text: string, interpolation: any): string {
    return text.replace(/{{(\w+)}}/gi, (_, param) =>
      Reflect.has(interpolation, param) ? interpolation[param] : '',
    );
  }
}
