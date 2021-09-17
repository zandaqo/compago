import { html, render } from "lit";
import { translate } from "../translate-directive";
import { Component } from "../component";
import { jest } from "@jest/globals";

class ComponentClass extends Component {}
window.customElements.define("translate-component", ComponentClass);

describe("translate", () => {
  it("calls a translator", () => {
    ComponentClass.translate = jest.fn();
    const interpolation = {};
    const component = document.createElement("translate-component");
    render(
      html`<input type="text" value=${translate("apple", interpolation)} />`,
      component,
      { host: component },
    );
    expect(ComponentClass.translate).toHaveBeenCalledWith(
      "apple",
      interpolation,
    );
  });
});
