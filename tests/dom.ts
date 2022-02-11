import { JSDOM } from "../dev_deps.ts";

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`);
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;
