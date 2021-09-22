import {
  Directive,
  directive,
  EventPart,
  PartInfo,
  PartType,
} from "lit-html/directive.js";

type ComponentBond = {
  to: string;
  // deno-lint-ignore ban-types
  parse?: Function;
  validate?: (element: Element, content: unknown) => boolean;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: unknown;
};

export class BondDirective extends Directive {
  options?: ComponentBond;
  recipient?: Record<string, unknown>;
  path?: string;
  element?: Element;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.EVENT) {
      throw new Error("navigate only supports event expressions");
    }
    this.handler = this.handler.bind(this);
  }
  update(part: EventPart, [options]: [ComponentBond]): unknown {
    const { to } = options;
    let path = to;
    let recipient = part.options?.host as Record<string, unknown>;
    // TODO: rename Component#model into $ to avoid special-casing?
    if (path[0] === ":") {
      recipient = recipient.model as Record<string, unknown>;
      path = path.slice(1);
    }
    if (path.includes(".")) {
      // TODO: optimize to avoid splitting
      const chunks = path.split(".");
      path = chunks[chunks.length - 1];
      for (let i = 0; i < chunks.length - 1; i += 1) {
        recipient = recipient[chunks[i]] as Record<string, unknown>;
      }
    }
    this.options = options;
    this.recipient = recipient;
    this.path = path;
    this.element = part.element;
    return this.render(this.options);
  }

  render(_options: ComponentBond): unknown {
    return this.handler;
  }

  handler(event: Event): void {
    const {
      parse,
      prevent,
      property = "value",
      attribute,
      value,
      validate,
    } = this.options!;

    if (prevent) event.preventDefault();
    let content = Reflect.has(this.options!, "value")
      ? value
      : attribute != null
      ? (this.element as HTMLElement).getAttribute(attribute)
      : this.element![property as keyof Element];
    if (typeof validate === "function" && !validate(this.element!, content)) {
      return;
    }
    if (typeof parse === "function") content = parse(content);
    this.recipient![this.path!] = content;
  }
}

export const bond = directive(BondDirective);
