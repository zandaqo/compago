import type {
  ReactiveController,
  ReactiveControllerHost,
} from "@lit/reactive-element";
import { LanguageChangeEvent } from "./language-change-event.ts";
import type { Localizer } from "./localizer.ts";

export class LocalizerController implements ReactiveController {
  host: ReactiveControllerHost;
  // deno-lint-ignore no-explicit-any
  localizer = (globalThis as any)[Symbol.for("c-localizer")] as Localizer;
  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
    this.onLanguageChange = this.onLanguageChange.bind(this);
  }
  hostConnected() {
    this.localizer.addEventListener(
      "language-change",
      this.onLanguageChange,
    );
  }
  hostDisconnected() {
    this.localizer.removeEventListener(
      "language-change",
      this.onLanguageChange,
    );
  }
  onLanguageChange(_: LanguageChangeEvent) {
    this.host.requestUpdate();
  }
  localize(key: string, interpolation?: unknown): string {
    return this.localizer.localize(
      // deno-lint-ignore no-explicit-any
      (this.host.constructor as any).localizations,
      key,
      interpolation,
    ) || key;
  }
}
