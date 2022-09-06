import {
  createRef,
  css,
  customElement,
  html,
  LitElement,
  Observable,
  observe,
  observer,
  ref,
  repeat,
} from "./deps.ts";
import { Todo } from "./todo.ts";
import "./todo-item.ts";

@customElement("todo-app")
@observer()
export class TodoApp extends LitElement {
  @observe()
  state = new Observable({ items: [] as Array<Todo> });
  input = createRef<HTMLInputElement>();
  static styles = css`
    h1 {
      font-size: 70px;
      line-height: 70px;
      font-weight: 100;
      text-align: center;
      color: rgba(175, 47, 47, 0.15);
    }
    section {
      background: #fff;
      margin: 30px 0 40px 0;
      position: relative;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
    }
    input[type=text] {
      padding: 16px 16px 16px 60px;
      border: none;
      background: rgba(0, 0, 0, 0.003);
      position: relative;
      margin: 0;
      width: 100%;
      font-size: 24px;
      font-family: inherit;
      font-weight: inherit;
      line-height: 1.4em;
      border: 0;
      outline: none;
      color: inherit;
      padding: 6px;
      border: 1px solid #CCC;
      box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
  }
`;

  onSubmit(event: KeyboardEvent) {
    if (event.code !== "Enter") return;
    const input = this.input.value;
    if (input && input.value) {
      this.state.items.push(new Todo({ text: input.value }));
      input.value = "";
    }
  }

  onRemove(event: CustomEvent<{ id: string }>) {
    const id = event.detail.id;
    if (!id) return;
    const index = this.state.items.findIndex((item) => item.id === id);
    if (~index) this.state.items.splice(index, 1);
  }

  render() {
    return html`
      <h1>Todos Compago & Lit</h1>
      <section>
        <input type="text" placeholder="What needs to be done?"
          @keyup=${this.onSubmit} ${ref(this.input)} />
          ${
      repeat(this.state.items, (todo) =>
        todo.id, (todo) =>
        html`<todo-item .todo=${todo} @remove=${this.onRemove}></todo-item>`)
    }
      </section>
  `;
  }
}
