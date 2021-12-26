import { Directive, directive, PartType } from "./deps.ts";
import type { Part, PartInfo } from "./deps.ts";
import type { LocalizerController } from "./localizer-controller.ts";

type LocalizableElement = {
  localizer: LocalizerController;
};

export class LocalizeDirective extends Directive {
  host?: unknown;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE &&
      partInfo.type !== PartType.CHILD && partInfo.type !== PartType.PROPERTY
    ) {
      throw new Error(
        "localize only supports attribute, property, and child expressions",
      );
    }
  }

  update(part: Part, [key, interpolation]: [string, unknown | undefined]) {
    this.host = part.options?.host;
    return this.render(key, interpolation);
  }

  render(key: string, interpolation?: unknown) {
    return (this.host as LocalizableElement).localizer.localize(
      key,
      interpolation,
    );
  }
}

export const localize = directive(LocalizeDirective);
