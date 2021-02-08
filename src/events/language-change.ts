type LanguageChangeEventDetail = {
  previous?: string;
};

export class LanguageChangeEvent extends CustomEvent<LanguageChangeEventDetail> {
  static create(detail: LanguageChangeEventDetail) {
    return new this('language-change', { detail, bubbles: true, composed: true });
  }
}
