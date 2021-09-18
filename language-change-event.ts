export class LanguageChangeEvent extends Event {
  constructor(public previous?: string) {
    super("language-change", {
      bubbles: true,
      composed: true,
    });
  }
}
