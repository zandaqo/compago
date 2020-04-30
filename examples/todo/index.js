import './todos';

document.addEventListener('DOMContentLoaded', () => {
  /* eslint no-new: 0 */
  const todos = document.createElement('todo-app');
  document.querySelector('#todoapp').appendChild(todos);
});
