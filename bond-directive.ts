import {
  Directive,
  directive,
  EventPart,
  PartInfo,
  PartType,
} from "lit/directive.js";

type ComponentBond = {
  to: string;
  parse?: Function;
  validate?: (element: Element, content: any) => boolean;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: any;
};

class Bond extends Directive {
  options?: ComponentBond;
  recipient?: unknown;
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
    let recipient = part.options?.host;
    if (path[0] === ":") {
      recipient = (recipient as any)!.model;
      path = path.slice(1);
    }
    if (path.includes(".")) {
      const chunks = path.split(".");
      path = chunks[chunks.length - 1];
      for (let i = 0; i < chunks.length - 1; i += 1) {
        recipient = (recipient as any)[chunks[i]];
      }
    }
    this.options = options;
    this.recipient = recipient;
    this.path = path;
    this.element = part.element;
    return this.render(this.options);
  }
  //@ts-ignore
  render(options: ComponentBond): unknown {
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
      ? this.element!.getAttribute(attribute)
      : (this.element as any)[property];
    if (typeof validate === "function" && !validate(this.element!, content)) {
      return;
    }
    if (typeof parse === "function") content = parse(content);
    (this.recipient as any)[this.path!] = content;
  }
}

export const bond = directive(Bond);
