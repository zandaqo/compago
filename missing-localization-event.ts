export class MissingLocalizationEvent extends Event {
  constructor(
    public component: string,
    public key: string,
    public rule?: string,
  ) {
    super("missing-localization", {
      bubbles: true,
      composed: true,
    });
  }
}
