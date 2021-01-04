interface ILanguageChangeEvent {
  previous?: string;
}

export class LanguageChangeEvent extends CustomEvent<ILanguageChangeEvent> {
  static readonly eventName = 'language-change';
  constructor(detail: ILanguageChangeEvent) {
    super(LanguageChangeEvent.eventName, { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface ElementEventMap {
    'language-change': LanguageChangeEvent;
  }
}
