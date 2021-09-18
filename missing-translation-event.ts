export class MissingTranslationEvent extends Event {
  constructor(
    public component: string,
    public key: string,
    public rule?: string,
  ) {
    super("missing-translation", {
      bubbles: true,
      composed: true,
    });
  }
}
