import { css, html, LitElement } from "npm:lit@2.7.5";
import { state } from "npm:lit@2.7.5/decorators.js";
import { bond } from "npm:compago@5.0.5";

class MyCounter extends LitElement {
  // HACK: Have to use `declare` here and assign default value separately
  // in the constructor to avoid overshadowing accessors:
  // https://lit.dev/docs/components/properties/#avoiding-issues-with-class-fields
  @state()
  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  static styles = css`
      * {
        font-size: 200%;
      }

      span {
        width: 4rem;
        display: inline-block;
        text-align: center;
      }

      button {
        width: 64px;
        height: 64px;
        border: none;
        border-radius: 10px;
        background-color: seagreen;
        color: white;
      }
    `;

  render() {
    return html`
      <button @click="${
      bond({ to: this, key: "count", value: this.count - 1 })
    }">-</button>
      <span>${this.count}</span>
      <button @click="${
      bond({ to: this, key: "count", value: this.count + 1 })
    }">+</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "my-counter": MyCounter;
  }
}

customElements.define("my-counter", MyCounter);
