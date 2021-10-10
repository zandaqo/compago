import type {
  ReactiveController,
  ReactiveControllerHost,
  ReactiveElement,
} from "@lit/reactive-element";
import { LanguageChangeEvent } from "./language-change-event.ts";
import type { Translator } from "./translator.ts";

export class TranslateController implements ReactiveController {
  host: ReactiveControllerHost;
  translator = (globalThis as any)[Symbol.for("c-translator")] as Translator;
  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
    this.onLanguageChange = this.onLanguageChange.bind(this);
  }
  hostConnected() {
    this.translator.addEventListener(
      "language-change",
      this.onLanguageChange,
    );
  }
  hostDisconnected() {
    this.translator.removeEventListener(
      "language-change",
      this.onLanguageChange,
    );
  }
  onLanguageChange(_: LanguageChangeEvent) {
    this.host.requestUpdate();
  }
  translate(key: string, interpolation?: unknown): string {
    return this.translator.translate(
      (this.host.constructor as any).translations,
      key,
      interpolation,
    ) || key;
  }
}
