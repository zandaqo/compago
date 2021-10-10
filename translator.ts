import { LanguageChangeEvent } from "./language-change-event.ts";
import { MissingTranslationEvent } from "./missing-translation-event.ts";

type PluralTranslation = Partial<Record<Intl.LDMLPluralRule, string>>;

const sTranslator = Symbol.for("c-translator");

declare global {
  interface window {
    [sTranslator]: Translator;
  }
}

export type Translations = {
  [language: string]: {
    [key: string]:
      | string
      | Intl.DateTimeFormat
      | Intl.NumberFormat
      | Intl.RelativeTimeFormat
      | PluralTranslation;
  };
};

type TranslatorOptions = {
  language?: string;
  languages: Array<string>;
  translations: Translations;
  globalPrefix?: string;
};

const { PluralRules, RelativeTimeFormat } = globalThis.Intl;

interface TranslatorEventMap {
  "language-change": LanguageChangeEvent;
  "missing-translation": MissingTranslationEvent;
}

export interface Translator {
  addEventListener<K extends keyof TranslatorEventMap>(
    type: K,
    listener: (this: Translator, ev: TranslatorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof TranslatorEventMap>(
    type: K,
    listener: (this: Translator, ev: TranslatorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

/**/
export class Translator extends EventTarget {
  globalPrefix: string;
  language: string;
  languages: Array<string>;
  pluralRules: Intl.PluralRules;
  translations: Translations;

  /**
   * @param options
   */
  constructor({
    language,
    languages,
    translations = {},
    globalPrefix = "$",
  }: TranslatorOptions) {
    super();
    this.languages = languages;
    this.translations = translations;
    this.globalPrefix = globalPrefix;
    this.language = language || this.getLanguage();
    this.pluralRules = new PluralRules(this.language);
  }

  /**
   * @param language
   * @returns
   */
  setLanguage(language: string): void {
    const { language: previous } = this;
    const hasChanged = previous !== language;
    this.language = language;
    this.pluralRules = new PluralRules(language);
    if (hasChanged) {
      this.dispatchEvent(new LanguageChangeEvent(previous));
    }
  }

  /**
   * @param language
   * @returns
   */
  getLanguage(
    language = (globalThis.navigator as any).language || "en",
  ): string {
    const { languages } = this;
    // perfect match
    if (languages.includes(language)) return language;
    // language tag match
    const [tag] = language.split("-");
    if (tag && languages.includes(tag)) return tag;
    return languages[0];
  }

  /**
   * Noop
   *
   * @param component
   * @param key
   * @param rule
   * @returns
   */
  reportMissing(
    component: string = this.constructor.name,
    key: string,
    rule?: string,
  ): void {
    this.dispatchEvent(
      new MissingTranslationEvent(component, key, rule),
    );
  }

  /**
   * @param translations
   * @param key
   * @param interpolation
   * @param component
   * @returns
   */
  translate(
    translations: Translations,
    key: string,
    interpolation?: unknown,
    component?: string,
  ): string {
    const { language, globalPrefix } = this;
    // use global store if prefix found
    const resources = !key.startsWith(globalPrefix)
      ? translations?.[language]
      : this.translations[language];
    const translation = resources?.[key];

    if (translation) {
      if (!interpolation) return translation as string;
      if (
        typeof (interpolation as Record<string, unknown>).count === "number"
      ) {
        const rule: Intl.LDMLPluralRule = this.pluralRules.select(
          (interpolation as Record<string, number>).count,
        );
        const pluralTranslation = (translation as PluralTranslation)[rule] ||
          (translation as PluralTranslation).other;
        if (typeof pluralTranslation !== "undefined") {
          return (this.constructor as typeof Translator).interpolate(
            pluralTranslation,
            interpolation as Record<string, string>,
          );
        } else {
          this.reportMissing(component, key, rule);
          return "";
        }
      }
      if (typeof translation === "string") {
        return (this.constructor as typeof Translator).interpolate(
          translation,
          interpolation as Record<string, string>,
        );
      }
      if (Reflect.has(translation, "format")) {
        if (translation instanceof RelativeTimeFormat) {
          return translation.format(
            (interpolation as [number, Intl.RelativeTimeFormatUnit])[0],
            (interpolation as [number, Intl.RelativeTimeFormatUnit])[1],
          );
        }
        return (translation as Intl.DateTimeFormat | Intl.NumberFormat).format(
          interpolation as number,
        );
      }
    }
    this.reportMissing(component, key);
    return "";
  }

  /**
   * @param options
   * @param symbol
   * @returns
   */
  static initialize(
    options: TranslatorOptions,
    symbol = sTranslator,
  ): Translator {
    const translator = new Translator(options);
    // deno-lint-ignore no-explicit-any
    (window as any)[symbol] = translator;
    return translator;
  }

  /**
   * @param text
   * @param interpolation
   * @returns
   */
  static interpolate(
    text: string,
    interpolation: Record<string, string>,
  ): string {
    return text.replace(
      /{{(\w+)}}/gi,
      (_, param) =>
        Reflect.has(interpolation, param) ? interpolation[param] : "",
    );
  }
}
