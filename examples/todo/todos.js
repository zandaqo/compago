import { Controller } from '../../index';
import NamedRegExp from 'named-regexp-groups';
import TodosView from './todos-view';
import TodosArray from './todos-array';

class Todos extends Controller {
  constructor() {
    super();
    this.model = new TodosArray();
    this.render = this.render.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('data-filter', 'all');
    this.model.addEventListener('add', this.render);
    this.model.addEventListener('remove', this.render);
    this.render();
  }

  getTodoModel(element) {
    const modelElement = element.closest('[data-lid]');
    if (modelElement) return this.model[parseInt(modelElement.getAttribute('data-lid'), 10)];
    return undefined;
  }

  toggleCompleted(event, el) {
    const todo = this.getTodoModel(el);
    if (todo) todo.toggleComplete();
  }

  edit(event, el) {
    const todo = this.getTodoModel(el);
    if (todo) {
      todo.editing = true;
      const todoId = this.model.indexOf(todo);
      const input = this.querySelector(`[data-lid="${todoId}"] .edit`);
      if (input) input.focus();
    }
  }

  updateOnEnter(event, el) {
    if (event.which === 13) {
      this.close(event, el);
    }
  }

  revertOnEscape(event, el) {
    const todo = this.getTodoModel(el);
    if (todo && (event.which === 27)) {
      todo.editing = false;
    }
  }

  close(event, el) {
    const todo = this.getTodoModel(el);
    const value = el.value && el.value.trim();
    if (todo && value) {
      todo.title = value;
      todo.editing = false;
    }
  }

  destroy(event, el) {
    const todo = this.getTodoModel(el);
    if (todo) this.model.unset(todo);
  }

  createOnEnter(event, el) {
    const title = el.value.trim();
    if (event.which === 13 && title) {
      el.value = '';
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

  onFilterButton(event, el) {
    event.preventDefault();
    const filterValue = el.getAttribute('href');
    this.navigate(filterValue);
  }

  filter(filterValue) {
    this.setAttribute('data-filter', filterValue);
  }

  onFilterRoute(event) {
    this.filter(event.detail.params.filter);
  }
}

Todos.observedAttributes = ['data-filter', ':'];

Todos.handlers = {
  route: 'onFilterRoute',
  attributes: { handler: 'render', debounce: 10 },
  'keypress #new-todo': 'createOnEnter',
  'click #clear-completed': 'clearCompleted',
  'click #toggle-all': 'toggleAllComplete',
  'click #filters a': 'onFilterButton',
  'click .toggle': 'toggleCompleted',
  'dblclick label': 'edit',
  'click .destroy': 'destroy',
  'keypress .edit': 'updateOnEnter',
  'keydown .edit': 'revertOnEscape',
  'focusout .edit': 'close',
};

Todos.view = TodosView;

Todos.root = window.location.pathname.slice(0, -1);

Todos.routes = {
  filter: new NamedRegExp('/(?<filter>[^\]+)'),
};

customElements.define('todo-app', Todos);

export default Todos;
