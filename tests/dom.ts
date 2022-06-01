import { JSDOM } from "./test_deps.ts";

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`);
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;
globalThis.HTMLIFrameElement = dom.window.HTMLIFrameElement;
