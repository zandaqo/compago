import { html, render } from "lit";
import { navigate } from "../navigate-directive";

describe("navigate", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = window.document.createElement("div");
  });

  it("throws if attached to non-event expression", () => {
    expect(() => {
      render(html`<a href=${navigate("path")}></a>`, container);
    }).toThrow("navigate only supports event expressions");
  });

  it("saves a URL into browser history", () => {
    const historyLength = window.history.length;
    expect(window.location.pathname).toBe("/");
    render(html`<a @click=${navigate("path")}></a>`, container);
    const element = container.querySelector("a")!;
    element.click();
    expect(window.history.length).toBe(historyLength + 1);
    expect(window.location.pathname).toBe("/path");
  });

  it("uses element's href if no path provided", () => {
    const historyLength = window.history.length;
    expect(window.location.pathname).not.toBe("/anotherpath");
    render(html`<a href="/anotherpath" @click=${navigate()}></a>`, container);
    const element = container.querySelector("a")!;
    element.click();
    expect(window.history.length).toBe(historyLength + 1);
    expect(window.location.pathname).toBe("/anotherpath");
  });

  it("saves provided state", () => {
    const historyLength = window.history.length;
    const state = { a: 1 };
    render(
      html`<a href="/path" @click=${navigate(undefined, state)}></a>`,
      container,
    );
    const element = container.querySelector("a")!;
    element.click();
    expect(window.history.length).toBe(historyLength + 1);
    expect(window.history.state).toEqual(state);
  });
});
