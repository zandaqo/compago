// deno-lint-ignore-file ban-types
import { Directive, directive, PartType } from "./deps.ts";
import type { EventPart, PartInfo } from "./deps.ts";

type BondOptions<T extends object, K extends keyof T> = {
  to: T;
  key: K;
  // deno-lint-ignore no-explicit-any
  parse?: (...args: any[]) => T[K];
  validate?: (element: Element, content: unknown) => boolean;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: T[K];
};

export type BondFunction = <
  T extends object,
  K extends keyof T,
>(
  options: BondOptions<T, K>,
) => unknown;

export class BondDirective<T extends object, K extends keyof T>
  extends Directive {
  options!: BondOptions<T, K>;
  recipient!: T;
  property!: K;
  element!: Element;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.EVENT) {
      throw new Error("bond only supports event expressions");
    }
  }

  update(
    part: EventPart,
    [options]: [BondOptions<T, K>],
  ): unknown {
    this.options = options;
    this.recipient = options.to || part.element as T;
    this.property = options.key;
    this.element = part.element;
    return this.render();
  }

  render(): unknown {
    return this.handler;
  }

  handler = (event: Event) => {
    const {
      parse,
      prevent,
      property = "value",
      attribute,
      value,
      validate,
    } = this.options;

    if (prevent) event.preventDefault();
    let content = Reflect.has(this.options, "value")
      ? value
      : attribute != null
      ? (this.element as HTMLElement).getAttribute(attribute)
      : this.element![property as keyof Element];
    if (typeof validate === "function" && !validate(this.element!, content)) {
      return;
    }
    if (typeof parse === "function") content = parse(content);
    this.recipient[this.property] = content as T[K];
  };
}

export const bond = directive(BondDirective) as BondFunction;
