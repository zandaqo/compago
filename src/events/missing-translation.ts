interface IMissingTranslationEvent {
  component: string;
  key: string;
  rule?: string;
}

export class MissingTranslationEvent extends CustomEvent<IMissingTranslationEvent> {
  static readonly eventName = 'missing-translation';
  constructor(detail: IMissingTranslationEvent) {
    super(MissingTranslationEvent.eventName, { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface ElementEventMap {
    'missing-translation': MissingTranslationEvent;
  }
}
