export class Todo {
  id = globalThis.crypto.randomUUID();
  text = "";
  done = false;

  constructor(todo: Partial<Todo>) {
    Object.assign(this, todo);
  }
}
