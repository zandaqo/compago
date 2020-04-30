import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import NamedRegExp from 'named-regexp-groups';
import { Controller } from '../../index';
import TodosArray from './todos-array';

class Todos extends Controller {
  constructor() {
    super();
    this.model = new TodosArray();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('data-filter', 'all');
    this.addEventListener('route', this.onFilterRoute.bind(this));
    this.model.addEventListener('add', this.onModelChange);
    this.model.addEventListener('remove', this.onModelChange);
  }

  getTodoModel(element) {
    const modelElement = element.closest('[data-lid]');
    if (modelElement) return this.model[parseInt(modelElement.getAttribute('data-lid'), 10)];
    return undefined;
  }

  toggleCompleted(event) {
    const todo = this.getTodoModel(event.target);
    if (todo) todo.toggleComplete();
  }

  edit(event) {
    const todo = this.getTodoModel(event.target);
    if (todo) {
      todo.editing = true;
      const todoId = this.model.indexOf(todo);
      const input = this.querySelector(`[data-lid="${todoId}"] .edit`);
      if (input) input.focus();
    }
  }

  updateOnEnter(event) {
    if (event.which === 13) {
      this.close(event);
    }
  }

  revertOnEscape(event) {
    const todo = this.getTodoModel(event.target);
    if (todo && event.which === 27) {
      todo.editing = false;
    }
  }

  close(event) {
    const todo = this.getTodoModel(event.target);
    const value = event.target.value && event.target.value.trim();
    if (todo && value) {
      todo.title = value;
      todo.editing = false;
    }
  }

  destroy(event) {
    const todo = this.getTodoModel(event.target);
    if (todo) this.model.unset(todo);
  }

  createOnEnter(event) {
    const title = event.target.value.trim();
    if (event.which === 13 && title) {
      event.target.value = '';
      this.model.push({
        title,
        order: this.model.nextOrder(),
        completed: false,
      });
    }
  }

  clearCompleted() {
    this.model.unset(this.model.completed());
    return false;
  }

  toggleAllComplete() {
    const completed = this.querySelector('#toggle-all').checked;
    this.model.forEach((todo) => {
      todo.completed = completed;
    });
  }

  onFilterRoute(event) {
    this.setAttribute('data-filter', event.detail.params.filter);
  }

  render() {
    const { model } = this;
    const remaining = model.remaining().length;
    const completed = model.completed().length;
    const filter = this.getAttribute('data-filter');
    const todoClasses = model.map((item) => {
      const classNames = [];
      if (item.completed) classNames.push('completed');
      if (item.editing) classNames.push('editing');
      return classNames.join(' ');
    });
    return html` <link rel="stylesheet" href="styles.css" />
      <div>
        <header id="header">
          <h1>todos</h1>
          <input
            id="new-todo"
            @keypress="${this.createOnEnter}"
            class="new-todo"
            placeholder="What needs to be done?"
            autofocus
          />
        </header>
        <section id="main" class="main" ?hidden=${!model.length}>
          <input
            id="toggle-all"
            @click="${this.toggleAllComplete}"
            class="toggle-all"
            type="checkbox"
            .checked="${!remaining}"
          />
          <label for="toggle-all">Mark all as complete</label>
          <ul id="todo-list" class="todo-list">
            ${repeat(
              model,
              (i) => i.uid,
              (todo, index) => {
                const isCompleted = todo.completed ? 'completed' : 'active';
                const isVisible = filter === 'all' || filter === isCompleted;
                return html`<li
                  class="${todoClasses[index]}"
                  ?hidden="${!isVisible}"
                  data-lid="${index}"
                >
                  <div class="view">
                    <input
                      class="toggle"
                      @click="${this.toggleCompleted}"
                      type="checkbox"
                      .checked="${todo.completed}"
                    />
                    <label @dblclick="${this.edit}">${todo.title}</label>
                    <button class="destroy" @click="${this.destroy}"></button>
                  </div>
                  <input
                    class="edit"
                    @keypress="${this.updateOnEnter}"
                    @keydown="${this.revertOnEscape}"
                    @focusout="${this.close}"
                    type="text"
                    .value="${todo.title}"
                  />
                </li>`;
              },
            )}
          </ul>
        </section>
        <footer id="footer" class="footer" ?hidden="${!model.length}">
          <span id="todo-count" class="todo-count">
            <strong>${remaining}</strong> ${remaining === 1 ? ' item' : ' items'} left</span
          >
          <ul id="filters" class="filters">
            <li>
              <a
                href="/all"
                @click="${this.navigate}"
                class="${filter === 'all' ? 'selected' : ''}"
              >
                All
              </a>
            </li>
            <li>
              <a
                href="/active"
                @click="${this.navigate}"
                class="${filter === 'active' ? 'selected' : ''}"
                >Active</a
              >
            </li>
            <li>
              <a
                href="/completed"
                @click="${this.navigate}"
                class="${filter === 'completed' ? 'selected' : ''}"
                >Completed</a
              >
            </li>
          </ul>
          <button
            id="clear-completed"
            @click="${this.clearCompleted}"
            class="clear-completed"
            hidden="${!completed}"
          >
            Clear completed ${completed}
          </button>
        </footer>
      </div>`;
  }
}

Todos.root = window.location.pathname.slice(0, -1);

Todos.routes = {
  filter: new NamedRegExp('/(?<filter>[^]+)'),
};

customElements.define('todo-app', Todos);

export default Todos;
