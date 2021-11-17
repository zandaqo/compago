// @ts-nocheck it's a shim!
// deno-lint-ignore-file no-unused-vars

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const attributes: WeakMap<HTMLElement, Map<string, string>> = new WeakMap();
const attributesForElement = (element: HTMLElement) => {
  let attrs = attributes.get(element);
  if (!attrs) {
    attributes.set(element, attrs = new Map());
  }
  return attrs;
};

class Node {}
class ChildNode {}
class HTMLTemplateElement {}
class DocumentFragment {}

class Element extends EventTarget {}

abstract class HTMLElement extends Element {
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value,
    }));
  }
  abstract attributeChangedCallback?(
    name: string,
    old: string | null,
    value: string | null,
  ): void;
  setAttribute(name: string, value: string) {
    attributesForElement(this).set(name, value);
  }
  removeAttribute(name: string) {
    attributesForElement(this).delete(name);
  }
  hasAttribute(name: string) {
    return attributesForElement(this).has(name);
  }
  attachShadow() {
    return { host: this };
  }
  getAttribute(name: string) {
    const value = attributesForElement(this).get(name);
    return value === undefined ? null : value;
  }
}

interface CustomHTMLElement {
  new (): HTMLElement;
  observedAttributes?: string[];
}

class ShadowRoot {}
// deno-lint-ignore no-empty-interface
interface ShadowRootInit {}
class Document {
  title: string;
  get adoptedStyleSheets() {
    return [];
  }
  createTreeWalker() {
    return {};
  }
  createTextNode() {
    return {};
  }
  createElement(_tag: keyof HTMLElementTagNameMap) {
    return {};
  }
  createComment() {
    return {};
  }
}

class CSSStyleSheet {
  replace() {}
}

type CustomElementRegistration = {
  ctor: { new (): HTMLElement };
  observedAttributes: string[];
};

class CustomElementRegistry {
  private __definitions = new Map<string, CustomElementRegistration>();

  define(name: string, ctor: CustomHTMLElement) {
    this.__definitions.set(name, {
      ctor,
      observedAttributes: (ctor as CustomHTMLElement).observedAttributes ??
        [],
    });
  }

  get(name: string) {
    const definition = this.__definitions.get(name);
    return definition && definition.ctor;
  }
}

class PopStateEvent extends Event {
  state?: unknown;
  constructor(name: string, init?: { state: unknown } & EventInit) {
    super(name, init);
    this.state = init?.state;
  }
}

const history = {
  pushState(_state?: unknown, _title?: string, _path?: string) {
    return;
  },
  replaceState(_state?: unknown, _title?: string, _path?: string) {
    return;
  },
};

Object.assign(window, {
  Element,
  HTMLElement,
  Document,
  document: new Document(),
  CSSStyleSheet,
  ShadowRoot,
  CustomElementRegistry,
  customElements: new CustomElementRegistry(),
  MutationObserver: class {
    observe() {}
  },
  // No-op any async tasks
  requestAnimationFrame() {},
  history,
  PopStateEvent,
});

interface HTMLElementTagNameMap {
  [key: string]: unknown;
}

interface Window {
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
  Document: typeof Document;
  document: Document;
  CSSStyleSheet: typeof CSSStyleSheet;
  ShadowRoot: typeof ShadowRoot;
  CustomElementRegistry: typeof CustomElementRegistry;
  customElements: CustomElementRegistry;
  MutationObserver: {
    observe(): void;
  };
  requestAnimationFrame(): void;
  history: typeof history;
}
