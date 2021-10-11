import "./dom-shim.ts";
import { assertEquals } from "testing/asserts.ts";
import { Spy, spy } from "mock/spy.ts";
import type { ReactiveControllerHost } from "@lit/reactive-element";
import { LocalizerController } from "../localizer-controller.ts";
import type { LanguageChangeEvent } from "../language-change-event.ts";
import { isBound } from "../utilities.ts";

const { test } = Deno;

class LocalizedElement {
  addController = spy();
  requestUpdate = spy();
  static localizations = { en: {} };
}

const localizerContext = (
  callback: (controller: LocalizerController) => void,
) => {
  // deno-lint-ignore no-explicit-any
  (globalThis as any)[Symbol.for("c-localizer")] = {
    addEventListener: spy(),
    removeEventListener: spy(),
    localize: spy(),
  };
  const localizer = new LocalizerController(
    new LocalizedElement() as unknown as ReactiveControllerHost,
  );
  return () => callback(localizer);
};

test("[LocalizerController#constructor] creates a localizer controller", () => {
  const host = new LocalizedElement() as unknown as ReactiveControllerHost;
  const localizer = new LocalizerController(host);
  assertEquals(localizer.host, host);
  assertEquals(isBound(localizer.onLanguageChange), true);
});

test(
  "[LocalizerController#hostConnected] subscribes to language change event of the global localizer",
  localizerContext((localizer) => {
    localizer.hostConnected();
    assertEquals(
      (localizer.localizer.addEventListener as Spy<void>).calls[0].args,
      [
        "language-change",
        localizer.onLanguageChange,
      ],
    );
  }),
);

test(
  "[LocalizerController#hostDisconnected] unsubscribes from language change event of the global localizer",
  localizerContext((localizer) => {
    localizer.hostDisconnected();
    assertEquals(
      (localizer.localizer.removeEventListener as Spy<void>).calls[0].args,
      [
        "language-change",
        localizer.onLanguageChange,
      ],
    );
  }),
);

test(
  "[LocalizerController#onLanguageChange] updates host when the language changes",
  localizerContext((localizer) => {
    localizer.onLanguageChange({} as unknown as LanguageChangeEvent);
    assertEquals(
      (localizer.host.requestUpdate as Spy<void>).calls.length,
      1,
    );
  }),
);

test(
  "[LocalizerController#localize] localizes a given string",
  localizerContext((localizer) => {
    const result = localizer.localize("a", { b: "b" });
    assertEquals(
      (localizer.localizer.localize as Spy<void>).calls[0].args,
      [LocalizedElement.localizations, "a", { b: "b" }],
    );
    assertEquals(result, "a");
  }),
);
