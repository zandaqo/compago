import {
  Directive,
  directive,
  EventPart,
  PartInfo,
  PartType,
} from "lit-html/directive.js";

export class NavigateDirective extends Directive {
  path: string | undefined;
  state: unknown;
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.EVENT) {
      throw new Error("navigate only supports event expressions");
    }
    this.handler = this.handler.bind(this);
  }

  update(
    part: EventPart,
    [href, state]: [string | undefined, unknown],
  ): unknown {
    this.path = href;
    this.state = state;
    if (!href) {
      this.path = part.element.getAttribute("href")!;
    }
    return this.render();
  }

  render(_path?: string, _state?: unknown): unknown {
    return this.handler;
  }

  handler(event: Event): void {
    event.preventDefault();
    window.history.pushState(this.state, window.document.title, this.path);
    globalThis.dispatchEvent(
      new PopStateEvent("popstate", { state: this.state }),
    );
  }
}

export const navigate = directive(NavigateDirective);
