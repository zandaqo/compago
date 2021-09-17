import {
  Directive,
  directive,
  Part,
  PartInfo,
  PartType,
} from "lit/directive.js";

type TranslatableComponent = {
  translate(key: string, interpolation?: unknown): string;
};

class TranslateDirective extends Directive {
  host?: unknown;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE &&
      partInfo.type !== PartType.CHILD && partInfo.type !== PartType.PROPERTY
    ) {
      throw new Error(
        "translate only supports attribute, property, and child expressions",
      );
    }
  }

  update(part: Part, [key, interpolation]: [string, unknown | undefined]) {
    this.host = part.options?.host?.constructor;
    return this.render(key, interpolation);
  }

  render(key: string, interpolation?: unknown) {
    return (this.host as TranslatableComponent).translate(key, interpolation);
  }
}

export const translate = directive(TranslateDirective);
