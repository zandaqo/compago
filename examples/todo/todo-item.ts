import {
  bond,
  css,
  customElement,
  html,
  LitElement,
  observe,
  observer,
  state,
} from "./deps.ts";
import { Todo } from "./todo.ts";

@observer()
@customElement("todo-item")
export class TodoItem extends LitElement {
  @observe()
  todo!: Todo;

  @state()
  isEditing = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      font-size: 24px;
      border-bottom: 1px solid #ededed;
    }
    input {
        text-align: center;
        width: 40px;
        /* auto, since non-WebKit browsers doesn't support input styling */
        height: auto;
        position: absolute;
        top: 9px;
        bottom: 0;
        margin: auto 0;
        border: none;
        /* Mobile Safari */
        -webkit-appearance: none;
        appearance: none;
    }
    input:after {
        content: url('data:image/svg+xml;utf8,<svg%20xmlns%3D"http%3A//www.w3.org/2000/svg"%20width%3D"40"%20height%3D"40"%20viewBox%3D"-10%20-18%20100%20135"><circle%20cx%3D"50"%20cy%3D"50"%20r%3D"50"%20fill%3D"none"%20stroke%3D"%23ededed"%20stroke-width%3D"3"/></svg>');
    }
    input:checked:after {
        content: url('data:image/svg+xml;utf8,<svg%20xmlns%3D"http%3A//www.w3.org/2000/svg"%20width%3D"40"%20height%3D"40"%20viewBox%3D"-10%20-18%20100%20135"><circle%20cx%3D"50"%20cy%3D"50"%20r%3D"50"%20fill%3D"none"%20stroke%3D"%23bddad5"%20stroke-width%3D"3"/><path%20fill%3D"%235dc2af"%20d%3D"M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z"/></svg>');
    }
    label {
        white-space: pre;
        word-break: break-word;
        padding: 15px 60px 15px 15px;
        margin-left: 45px;
        display: block;
        line-height: 1.2;
        transition: color 0.4s;
    }
    input:checked + label {
        color: #d9d9d9;
        text-decoration: line-through;
    }
    button,
    input[type="checkbox"] {
        outline: none;
    }
    button {
        margin: 0;
        padding: 0;
        border: 0;
        background: none;
        font-size: 100%;
        vertical-align: baseline;
        font-family: inherit;
        font-weight: inherit;
        color: inherit;
        -webkit-appearance: none;
        appearance: none;
        -webkit-font-smoothing: antialiased;
        -moz-font-smoothing: antialiased;
        font-smoothing: antialiased;
    }
    button {
        position: absolute;
        top: 0;
        right: 10px;
        bottom: 0;
        width: 40px;
        height: 40px;
        margin: auto 0;
        font-size: 30px;
        color: #cc9a9a;
        margin-bottom: 11px;
        transition: color 0.2s ease-out;
    }
    button:hover {
        color: #af5b5e;
    }
  `;

  onRemove() {
    this.dispatchEvent(
      new CustomEvent("remove", {
        detail: { id: this.todo.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <input type="checkbox" .checked=${this.todo.done} @click=${
      bond({
        to: this.todo,
        key: "done",
        property: "checked",
      })
    }>
      <label>${this.todo.text}</label>
      <button @click=${this.onRemove}>x</button>
    `;
  }
}
