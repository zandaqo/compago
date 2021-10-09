import {
  Directive,
  directive,
  Part,
  PartInfo,
  PartType,
} from "lit-html/directive.js";
import type { TranslateController } from "./translate-controller.ts";

type TranslatableElement = {
  translator: TranslateController;
};

export class TranslateDirective extends Directive {
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
    this.host = part.options?.host;
    return this.render(key, interpolation);
  }

  render(key: string, interpolation?: unknown) {
    return (this.host as TranslatableElement).translator.translate(
      key,
      interpolation,
    );
  }
}

export const translate = directive(TranslateDirective);
