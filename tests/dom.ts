import { parseHTML } from "./test_deps.ts";

const { document, HTMLElement, customElements, HTMLIFrameElement } = parseHTML(
  `<!DOCTYPE html><html><head></head><body></body></html>`,
);
globalThis.document = document;
globalThis.HTMLElement = HTMLElement;
globalThis.customElements = customElements;
globalThis.HTMLIFrameElement = HTMLIFrameElement;
