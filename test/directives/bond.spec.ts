import { bond } from "../../src/directives/bond";
import { Component } from "../../src/component";
import { Observable } from "../../src/observable";
import { html, render } from "lit-html";

class ComponentClass extends Component {}
window.customElements.define("c-b-component", ComponentClass);

describe("bond", () => {
  let component: ComponentClass;

  beforeEach(() => {
    component = document.createElement("c-b-component") as ComponentClass;
    component.model = new Observable({});
  });

  it("handles one way binding between DOM elements and the model", () => {
    render(
      html`<input type="text" @input=${bond({ to: ":name" })} />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.value = "abc";
    input.dispatchEvent(new Event("input"));
    expect(component.model!.toJSON()).toEqual({ name: "abc" });
  });

  it("binds to a nested attribute of the model if attribute name contains `.`", () => {
    component.model = new Observable({});
    (component.model as any).name = {};
    render(
      html`<input type="text" @input=${bond({ to: ":name.first" })} />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.value = "abc";
    input.dispatchEvent(new Event("input"));
    expect(component.model.toJSON()).toEqual({ name: { first: "abc" } });
  });

  it("binds to a property of the component", () => {
    render(
      html`<input type="text" @input=${bond({ to: "name" })} />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.value = "abc";
    input.dispatchEvent(new Event("input"));
    expect((component as any).name).toBe("abc");
  });

  xit("prevents default action if `prevent:true`", () => {});

  it("parses value if parsing function is provided as `parse` option", () => {
    render(
      html`<input
        type="text"
        @input=${bond({ to: ":name", parse: parseInt })}
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.value = "12";
    input.dispatchEvent(new Event("input"));
    expect(component.model!.toJSON()).toEqual({ name: 12 });
  });

  xit("no-op if invalid binding configuration is provided", () => {
    render(html`<input type="text" @input=${bond({ to: "" })} />`, component);
    const input = component.shadowRoot!.querySelector("input")!;
    input.value = "12";
  });

  it("sets a value from a specified property", () => {
    render(
      html`<input
        type="text"
        @input=${bond({ to: "isDisabled", property: "disabled" })}
        disabled
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("input"));
    expect((component as any).isDisabled).toBe(true);
  });

  it("sets a value from a specified attribute", () => {
    render(
      html`<input
        type="text"
        @input=${bond({ to: "inputType", attribute: "type" })}
        disabled
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("input"));
    expect((component as any).inputType).toBe("text");
  });

  it("sets a constant value", () => {
    render(
      html`<input
        type="text"
        @input=${bond({ to: "name", value: "abc" })}
        disabled
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("input"));
    expect((component as any).name).toBe("abc");
  });

  it("validates input before parsing if validation function is provided", () => {
    render(
      html`<input
        type="text"
        @input=${
        bond({
          to: "name",
          value: "abc",
          validate: (_, content) => typeof content === "string",
        })
      }
        disabled
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("input"));
    expect((component as any).name).toBe("abc");
  });

  it("does not set value if validation function is provided and returns a falsy value", () => {
    render(
      html`<input
        type="text"
        @input=${bond({ to: "name", value: "abc", validate: () => false })}
        disabled
      />`,
      component.shadowRoot!,
      { eventContext: component },
    );
    const input = component.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("input"));
    expect((component as any).name).toBeUndefined();
  });
});
