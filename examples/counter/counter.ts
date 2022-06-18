import { css, html, LitElement } from "https://cdn.skypack.dev/lit@2.2.6?dts";
import { state } from "https://cdn.skypack.dev/lit@2.2.6/decorators.js?dts";
import { bond } from "https://cdn.skypack.dev/compago@5.0.1";

class MyCounter extends LitElement {
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
