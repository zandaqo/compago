interface ILanguageChangeEvent {
  previous?: string;
}

export class LanguageChangeEvent extends CustomEvent<ILanguageChangeEvent> {
  static create(detail: ILanguageChangeEvent) {
    return new this('language-change', { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    'language-change': LanguageChangeEvent;
  }
}
