import { assertEquals, spy } from "../dev_deps.ts";
import { Localizations, Localizer } from "../localizer.ts";

const { test } = Deno;

test(
  "[Localizer#constructor] creates a localizer with given options",
  () => {
    const localizer = new Localizer({
      language: "en",
      languages: ["en", "es"],
      localizations: {
        en: { $save: "Save" },
        es: { $save: "Guardar" },
      },
    });
    assertEquals(localizer instanceof Localizer, true);
    assertEquals(localizer.language, "en");
    assertEquals(localizer.pluralRules instanceof Intl.PluralRules, true);
    assertEquals(
      localizer.pluralRules.resolvedOptions(),
      new Intl.PluralRules("en").resolvedOptions(),
    );
    assertEquals(localizer.globalPrefix, "$");
  },
);

test("[Localizer#constructor] detects language upon creation if not provided", () => {
  const localizer = new Localizer({
    languages: ["ce", "en"],
    localizations: {},
  });
  assertEquals(localizer instanceof Localizer, true);
  assertEquals(localizer.language, "en");
});

test("[Localizer#setLanguage] changes the current language to a given language", () => {
  const localizer = new Localizer({
    languages: ["en"],
    localizations: {},
  });
  localizer.setLanguage("de-DE");
  assertEquals(localizer.language, "de-DE");
  assertEquals(localizer.pluralRules, new Intl.PluralRules("de-DE"));
});

test("[Localizer#setLanguage] emits `language-change` event if language has changed", () => {
  const localizer = new Localizer({
    languages: ["en", "en-GB"],
    localizations: {},
  });
  const languageChangeSpy = spy();
  localizer.dispatchEvent = languageChangeSpy;
  localizer.setLanguage("en");
  assertEquals(languageChangeSpy.calls.length, 0);
  localizer.setLanguage("en-GB");
  assertEquals(languageChangeSpy.calls.length, 1);
});

test("[Localizer#getLanguage] gets a language matching a given one from the list of supported languages", () => {
  const localizer = new Localizer({
    languages: ["en", "de", "en-GB"],
    localizations: {},
  });
  assertEquals(localizer.getLanguage("de-DE"), "de");
  assertEquals(localizer.getLanguage("en-US"), "en");
  assertEquals(localizer.getLanguage("en-GB"), "en-GB");
});

test("[Localizer#getLanguage] returns the first supported language if no match is found", () => {
  const localizer = new Localizer({
    languages: ["en", "de", "en-GB"],
    localizations: {},
  });
  assertEquals(localizer.getLanguage("zh"), "en");
});

test("[Localizer#getLanguage] uses user language if no language provided", () => {
  const localizer = new Localizer({
    languages: ["de", "en"],
    localizations: {},
  });
  assertEquals(localizer.getLanguage(), "en");
});

const localizerContext = (
  callback: (localizer: Localizer, localizations: Localizations) => void,
) => {
  return () => {
    const localizer = new Localizer({
      language: "en",
      languages: ["en", "es", "de"],
      localizations: {
        en: { $save: "Save" },
        es: { $save: "Guardar" },
      },
    });
    const localizations = {
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
        language: new Intl.DisplayNames("en", { type: "language" }),
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
        language: new Intl.DisplayNames("es", { type: "language" }),
      },
    };
    callback(localizer, localizations);
  };
};

test(
  "[Localizer#localize] localizes a given message using a local translation",
  localizerContext((localizer, localizations) => {
    assertEquals(localizer.localize(localizations, "open"), "Open");
    localizer.setLanguage("es");
    assertEquals(localizer.localize(localizations, "open"), "Abrir");
  }),
);

test(
  "[Localizer#localize] localizes using a global translation",
  localizerContext((localizer, localizations) => {
    assertEquals(localizer.localize(localizations, "$save"), "Save");
    localizer.setLanguage("es");
    assertEquals(localizer.localize(localizations, "$save"), "Guardar");
  }),
);

test(
  "[Localizer#localize] uses interpolation",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "hello", { name: "a" }),
      "Hello, a!",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "hello", { name: "a" }),
      "Hola, a!",
    );
  }),
);

test(
  "[Localizer#localize] handles plurals",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 0 }),
      "0 lemons",
    );
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 1 }),
      "One lemon",
    );
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 10 }),
      "10 lemons",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 0 }),
      "0 limónes",
    );
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 1 }),
      "Un limón",
    );
    assertEquals(
      localizer.localize(localizations, "lemons", { count: 10 }),
      "10 limónes",
    );
  }),
);

test(
  "[Localizer#localize] reports if a localization is missing for a plural rule",
  localizerContext((localizer, localizations) => {
    const missingSpy = spy(localizer, "reportMissing");
    assertEquals(
      localizer.localize(localizations, "apples", { count: 10 }),
      "",
    );
    assertEquals(missingSpy.calls[0].args, [undefined, "apples", "other"]);
    missingSpy.restore();
  }),
);

test(
  "[Localizer#localize] returns empty string if the message is not found",
  localizerContext((localizer, localizations) => {
    assertEquals(localizer.localize(localizations, "abc"), "");
  }),
);

test(
  "[Localizer#localize] calls report if a localization is missing",
  localizerContext((localizer, localizations) => {
    const cb = spy();
    localizer.addEventListener("missing-localization", cb);
    localizer.localize(localizations, "abc", undefined, "ABC");
    assertEquals(cb.calls[0].args[0].component, "ABC");
    assertEquals(cb.calls[0].args[0].key, "abc");
    localizer.removeEventListener("missing-localization", cb);
  }),
);

test(
  "[Localizer#localize] formats dates",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "date", new Date(0)),
      "1970 A",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "date", new Date(0)),
      "70 después de Cristo",
    );
  }),
);

test(
  "[Localizer#localize] formats numbers",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "amount", 1000000.999),
      "1,000,000.999",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "amount", 1000000.999),
      "1.000.000,999",
    );
  }),
);

test(
  "[Localizer#localize] formats relative time",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "ago", [2, "day"]),
      "in 2 days",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "ago", [2, "day"]),
      "dentro de 2 días",
    );
  }),
);

test(
  "[Localizer#localize] localizes names with DisplayNames",
  localizerContext((localizer, localizations) => {
    assertEquals(
      localizer.localize(localizations, "language", "en"),
      "English",
    );
    localizer.setLanguage("es");
    assertEquals(
      localizer.localize(localizations, "language", "en"),
      "inglés",
    );
  }),
);

test("[Localizer.initialize] creates and sets up a global localizer", () => {
  const localizer = Localizer.initialize({
    languages: ["en"],
    localizations: {},
  });
  // deno-lint-ignore no-explicit-any
  assertEquals((globalThis as any)[Symbol.for("c-localizer")], localizer);
});

test("[Localizer.interpolate] interpolates", () => {
  assertEquals(Localizer.interpolate("a {{b}} c", { b: "b" }), "a b c");
  assertEquals(Localizer.interpolate("a {{b}} c", {}), "a  c");
});
