import Todos from './todos';

document.addEventListener('DOMContentLoaded', () => {
  /* eslint no-new: 0 */
  const todos = new Todos();
  document.querySelector('#todoapp').appendChild(todos);
});
