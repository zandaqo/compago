import { LanguageChangeEvent } from "./language-change-event.ts";
import { MissingLocalizationEvent } from "./missing-localization-event.ts";

type Pluralization = Partial<Record<Intl.LDMLPluralRule, string>>;

const sLocalizer = Symbol.for("c-localizer");

export type Localizations = {
  [language: string]: {
    [key: string]:
      | string
      | Intl.DateTimeFormat
      | Intl.NumberFormat
      | Intl.RelativeTimeFormat
      | Pluralization;
  };
};

type LocalizerOptions = {
  language?: string;
  languages: Array<string>;
  localizations: Localizations;
  globalPrefix?: string;
};

const { PluralRules, RelativeTimeFormat } = globalThis.Intl;

interface LocalizerEventMap {
  "language-change": LanguageChangeEvent;
  "missing-localization": MissingLocalizationEvent;
}

export interface Localizer {
  addEventListener<K extends keyof LocalizerEventMap>(
    type: K,
    listener: (this: Localizer, ev: LocalizerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof LocalizerEventMap>(
    type: K,
    listener: (this: Localizer, ev: LocalizerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

/**/
export class Localizer extends EventTarget {
  globalPrefix: string;
  language: string;
  languages: Array<string>;
  pluralRules: Intl.PluralRules;
  localizations: Localizations;

  /**
   * @param options
   */
  constructor({
    language,
    languages,
    localizations = {},
    globalPrefix = "$",
  }: LocalizerOptions) {
    super();
    this.languages = languages;
    this.localizations = localizations;
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
    // deno-lint-ignore no-explicit-any
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
      new MissingLocalizationEvent(component, key, rule),
    );
  }

  /**
   * @param localizations
   * @param key
   * @param interpolation
   * @param component
   * @returns
   */
  localize(
    localizations: Localizations,
    key: string,
    interpolation?: unknown,
    component?: string,
  ): string {
    const { language, globalPrefix } = this;
    // use global store if prefix found
    const resources = !key.startsWith(globalPrefix)
      ? localizations?.[language]
      : this.localizations[language];
    const localizaion = resources?.[key];

    if (localizaion) {
      if (!interpolation) return localizaion as string;
      if (
        typeof (interpolation as Record<string, unknown>).count === "number"
      ) {
        const rule: Intl.LDMLPluralRule = this.pluralRules.select(
          (interpolation as Record<string, number>).count,
        );
        const pluralization = (localizaion as Pluralization)[rule] ||
          (localizaion as Pluralization).other;
        if (typeof pluralization !== "undefined") {
          return (this.constructor as typeof Localizer).interpolate(
            pluralization,
            interpolation as Record<string, string>,
          );
        } else {
          this.reportMissing(component, key, rule);
          return "";
        }
      }
      if (typeof localizaion === "string") {
        return (this.constructor as typeof Localizer).interpolate(
          localizaion,
          interpolation as Record<string, string>,
        );
      }
      if (Reflect.has(localizaion, "format")) {
        if (localizaion instanceof RelativeTimeFormat) {
          return localizaion.format(
            (interpolation as [number, Intl.RelativeTimeFormatUnit])[0],
            (interpolation as [number, Intl.RelativeTimeFormatUnit])[1],
          );
        }
        return (localizaion as Intl.DateTimeFormat | Intl.NumberFormat).format(
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
    options: LocalizerOptions,
    symbol = sLocalizer,
  ): Localizer {
    // deno-lint-ignore no-explicit-any
    // dnt-shim-ignore
    return (globalThis as any)[symbol] = new Localizer(options);
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
