import { Directive, directive, PartType } from "./deps.ts";
import type { EventPart, PartInfo } from "./deps.ts";

type BondOptions<T extends object, K extends keyof T> = {
  /**
   * An object that receives the value
   */
  to: T;
  /**
   * A property name of the receiving object to set the value
   */
  key: K;
  /**
   * Parse function to apply to the value, gets the bond value as the parameter
   */
  parse?: (...args: unknown[]) => T[K];
  /**
   * The validator function to check the value
   *
   * @param element The bound DOM element
   * @param content The value being checked
   */
  validate?: (element: Element, content: unknown) => boolean;
  /**
   * Whether to prevent the default event handling behavior
   */
  prevent?: boolean;
  /**
   * Name of the DOM element's property that provides the bond value
   */
  property?: string;
  /**
   * Name of the DOM element's attribute that provides the bond value
   */
  attribute?: string;
  /**
   * The constant value to be set on the bond object
   */
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

/**
 * Creates a one-way bond passing a value from a DOM element to
 * a JavaScript object or another DOM element every time
 * the listening event is fired.
 */
export const bond = directive(BondDirective) as BondFunction;
