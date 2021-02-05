interface IMissingTranslationEvent {
  component: string;
  key: string;
  rule?: string;
}

export class MissingTranslationEvent extends CustomEvent<IMissingTranslationEvent> {
  static create(detail: IMissingTranslationEvent) {
    return new this('missing-translation', { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    'missing-translation': MissingTranslationEvent;
  }
}
