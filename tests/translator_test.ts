import { assertEquals } from "testing/asserts.ts";
import { spy } from "mock/spy.ts";
import { Translations, Translator } from "../translator.ts";

const { test } = Deno;

test(
  "[Translator#constructor] creates a translator with given options",
  () => {
    const translator = new Translator({
      language: "en",
      languages: ["en", "es"],
      translations: {
        en: { $save: "Save" },
        es: { $save: "Guardar" },
      },
    });
    assertEquals(translator instanceof Translator, true);
    assertEquals(translator.language, "en");
    assertEquals(translator.pluralRules instanceof Intl.PluralRules, true);
    assertEquals(
      translator.pluralRules.resolvedOptions(),
      new Intl.PluralRules("en").resolvedOptions(),
    );
    assertEquals(translator.globalPrefix, "$");
  },
);

test("[Translator#constructor] detects language upon creation if not provided", () => {
  const translator = new Translator({
    languages: ["ce", "en"],
    translations: {},
  });
  assertEquals(translator instanceof Translator, true);
  assertEquals(translator.language, "en");
});

test("[Translator#setLanguage] changes the current language to a given language", () => {
  const translator = new Translator({
    languages: ["en"],
    translations: {},
  });
  translator.setLanguage("de-DE");
  assertEquals(translator.language, "de-DE");
  assertEquals(translator.pluralRules, new Intl.PluralRules("de-DE"));
});

test("[Translator#setLanguage] emits `language-change` event if language has changed", () => {
  const translator = new Translator({
    languages: ["en", "en-GB"],
    translations: {},
  });
  const languageChangeSpy = spy();
  translator.dispatchEvent = languageChangeSpy;
  translator.setLanguage("en");
  assertEquals(languageChangeSpy.calls.length, 0);
  translator.setLanguage("en-GB");
  assertEquals(languageChangeSpy.calls.length, 1);
});

test("[Translator#getLanguage] gets a language matching a given one from the list of supported languages", () => {
  const translator = new Translator({
    languages: ["en", "de", "en-GB"],
    translations: {},
  });
  assertEquals(translator.getLanguage("de-DE"), "de");
  assertEquals(translator.getLanguage("en-US"), "en");
  assertEquals(translator.getLanguage("en-GB"), "en-GB");
});

test("[Translator#getLanguage] returns the first supported language if no match is found", () => {
  const translator = new Translator({
    languages: ["en", "de", "en-GB"],
    translations: {},
  });
  assertEquals(translator.getLanguage("zh"), "en");
});

test("[Translator#getLanguage] uses user language if no language provided", () => {
  const translator = new Translator({
    languages: ["de", "en"],
    translations: {},
  });
  assertEquals(translator.getLanguage(), "en");
});

const translatorContext = (
  callback: (translator: Translator, translations: Translations) => void,
) => {
  return () => {
    const translator = new Translator({
      language: "en",
      languages: ["en", "es", "de"],
      translations: {
        en: { $save: "Save" },
        es: { $save: "Guardar" },
      },
    });
    const translations = {
      en: {
        open: "Open",
        hello: "Hello, {{name}}!",
        lemons: {
          one: "One lemon",
          other: "{{count}} lemons",
        },
        apples: {
          one: "One apple",
        },
        date: new Intl.DateTimeFormat("en", { year: "numeric", era: "narrow" }),
        amount: new Intl.NumberFormat("en"),
        ago: new Intl.RelativeTimeFormat("en", { style: "narrow" }),
      },
      es: {
        open: "Abrir",
        hello: "Hola, {{name}}!",
        lemons: {
          one: "Un limón",
          other: "{{count}} limónes",
        },
        apples: {
          one: "Una manzana",
        },
        date: new Intl.DateTimeFormat("es", { year: "2-digit", era: "long" }),
        amount: new Intl.NumberFormat("es"),
        ago: new Intl.RelativeTimeFormat("es", { style: "narrow" }),
      },
    };
    callback(translator, translations);
  };
};

test(
  "[Translator#translate] translates a given message using a local translation",
  translatorContext((translator, translations) => {
    assertEquals(translator.translate(translations, "open"), "Open");
    translator.setLanguage("es");
    assertEquals(translator.translate(translations, "open"), "Abrir");
  }),
);

test(
  "[Translator#translate] translates using a global translation",
  translatorContext((translator, translations) => {
    assertEquals(translator.translate(translations, "$save"), "Save");
    translator.setLanguage("es");
    assertEquals(translator.translate(translations, "$save"), "Guardar");
  }),
);

test(
  "[Translator#translate] uses interpolation",
  translatorContext((translator, translations) => {
    assertEquals(
      translator.translate(translations, "hello", { name: "a" }),
      "Hello, a!",
    );
    translator.setLanguage("es");
    assertEquals(
      translator.translate(translations, "hello", { name: "a" }),
      "Hola, a!",
    );
  }),
);

test(
  "[Translator#translate] handles plurals",
  translatorContext((translator, translations) => {
    assertEquals(
      translator.translate(translations, "lemons", { count: 0 }),
      "0 lemons",
    );
    assertEquals(
      translator.translate(translations, "lemons", { count: 1 }),
      "One lemon",
    );
    assertEquals(
      translator.translate(translations, "lemons", { count: 10 }),
      "10 lemons",
    );
    translator.setLanguage("es");
    assertEquals(
      translator.translate(translations, "lemons", { count: 0 }),
      "0 limónes",
    );
    assertEquals(
      translator.translate(translations, "lemons", { count: 1 }),
      "Un limón",
    );
    assertEquals(
      translator.translate(translations, "lemons", { count: 10 }),
      "10 limónes",
    );
  }),
);

test(
  "[Translator#translate] reports if translation is missing for a plural rule",
  translatorContext((translator, translations) => {
    const missingSpy = spy(translator, "reportMissing");
    assertEquals(
      translator.translate(translations, "apples", { count: 10 }),
      "",
    );
    assertEquals(missingSpy.calls[0].args, [undefined, "apples", "other"]);
    missingSpy.restore();
  }),
);

test(
  "[Translator#translate] returns empty string if the message is not found",
  translatorContext((translator, translations) => {
    assertEquals(translator.translate(translations, "abc"), "");
  }),
);

test(
  "[Translator#translate] calls report if the translation is missing",
  translatorContext((translator, translations) => {
    const cb = spy();
    translator.addEventListener("missing-translation", cb);
    translator.translate(translations, "abc", undefined, "ABC");
    assertEquals(cb.calls[0].args[0].component, "ABC");
    assertEquals(cb.calls[0].args[0].key, "abc");
    translator.removeEventListener("missing-translation", cb);
  }),
);

test(
  "[Translator#translate] formats dates",
  translatorContext((translator, translations) => {
    assertEquals(
      translator.translate(translations, "date", new Date(0)),
      "1970 A",
    );
    translator.setLanguage("es");
    assertEquals(
      translator.translate(translations, "date", new Date(0)),
      "70 después de Cristo",
    );
  }),
);

test(
  "[Translator#translate] formats numbers",
  translatorContext((translator, translations) => {
    assertEquals(
      translator.translate(translations, "amount", 1000000.999),
      "1,000,000.999",
    );
    translator.setLanguage("es");
    assertEquals(
      translator.translate(translations, "amount", 1000000.999),
      "1.000.000,999",
    );
  }),
);

test(
  "[Translator#translate] formats relative time",
  translatorContext((translator, translations) => {
    assertEquals(
      translator.translate(translations, "ago", [2, "day"]),
      "in 2 days",
    );
    translator.setLanguage("es");
    assertEquals(
      translator.translate(translations, "ago", [2, "day"]),
      "dentro de 2 días",
    );
  }),
);

test("[Translate.initialize] creates and sets up a global translator", () => {
  const translator = Translator.initialize({
    languages: ["en"],
    translations: {},
  });
  // deno-lint-ignore no-explicit-any
  assertEquals((globalThis as any)[Symbol.for("c-translator")], translator);
});

test("[Translate.interpolate] interpolates", () => {
  assertEquals(Translator.interpolate("a {{b}} c", { b: "b" }), "a b c");
  assertEquals(Translator.interpolate("a {{b}} c", {}), "a  c");
});
