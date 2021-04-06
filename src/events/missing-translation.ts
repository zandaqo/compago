type MissingTranslationEventDetail = {
  component: string;
  key: string;
  rule?: string;
};

export class MissingTranslationEvent extends CustomEvent<MissingTranslationEventDetail> {
  static create(detail: MissingTranslationEventDetail) {
    return new this('missing-translation', {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
