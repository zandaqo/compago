import { render, html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import './node_modules/todomvc-app-css/index.css';

function TodosView(controller) {
  const { model } = controller;
  const remaining = model.remaining().length;
  const completed = model.completed().length;
  const filter = controller.getAttribute('data-filter');
  const todoClasses = model.map((item) => {
    const classNames = [];
    if (item.completed) classNames.push('completed');
    if (item.editing) classNames.push('editing');
    return classNames.join(' ');
  });
  return html`
    <div>
      <header id="header">
        <h1>todos</h1>
        <input id="new-todo" class="new-todo" placeholder="What needs to be done?" autofocus />
      </header>
      <section id="main" class="main" ?hidden=${!model.length}>
        <input id="toggle-all" class="toggle-all" type="checkbox"
               .checked="${!remaining}" />
        <label for="toggle-all">Mark all as complete</label>
        <ul id="todo-list" class="todo-list">
          ${repeat(
            model,
            i => i.uid,
            (todo, index) => {
              const isCompleted = todo.completed ? 'completed' : 'active';
              const isVisible = (filter === 'all') || (filter === isCompleted);
              return html`
                        <li class="${todoClasses[index]}" ?hidden="${!isVisible}" data-lid="${index}">
                          <div class="view">
                            <input class="toggle" type="checkbox" .checked="${todo.completed}" />
                            <label>${todo.title}</label>
                            <button class="destroy"></button>
                          </div>
                          <input class="edit" type="text" .value="${todo.title}"/>
                        </li>`;
            },
          )}
        </ul>
      </section>
      <footer id="footer" class="footer" ?hidden="${!model.length}">
        <span id="todo-count" class="todo-count">
          <strong>${remaining}</strong> ${remaining === 1 ? ' item' : ' items'} left</span>
        <ul id="filters" class="filters">
          <li>
            <a href="/all" class="${filter === 'all' ? 'selected' : ''}">All</a>
          </li>
          <li>
            <a href="/active" class="${filter === 'active' ? 'selected' : ''}">Active</a>
          </li>
          <li>
            <a href="/completed" class="${filter === 'completed' ? 'selected' : ''}">Completed</a>
          </li>
        </ul>
        <button id="clear-completed"
                class="clear-completed"
                hidden="${!completed}">Clear completed ${completed}</button>
      </footer>
    </div>`;
}

export default (controller) => {
  render(TodosView(controller), controller);
};
