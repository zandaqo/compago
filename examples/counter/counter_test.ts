import { assertEquals } from "https://deno.land/std@0.140.0/testing/asserts.ts";
// @ts-ignore 2306
import { JSDOM } from "https://esm.sh/jsdom@19.0.0";

const {
  window,
} = new JSDOM(
  `<!DOCTYPE html><html><head></head><body></body></html>`,
);
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.customElements = window.customElements;
globalThis.HTMLIFrameElement = window.HTMLIFrameElement;
globalThis.CSSStyleSheet = window.CSSStyleSheet;

/* Load our Web Component asyncronously */
await import("./counter.ts");

Deno.test("Registers the component", () => {
  const element = document.createElement("my-counter");
  assertEquals(element.count, 0);
});

Deno.test("Changes the counter", async () => {
  const element = document.createElement("my-counter");
  document.body.appendChild(element);
  await element.updateComplete;
  const [descrease, increase] = element.renderRoot.querySelectorAll("button");
  increase.click();
  assertEquals(element.count, 1);
  await element.updateComplete;
  increase.click();
  assertEquals(element.count, 2);
  await element.updateComplete;
  descrease.click();
  assertEquals(element.count, 1);
});
