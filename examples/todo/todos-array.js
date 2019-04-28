import { ModelArray } from '../../index';
import TodoModel from './todo-model';

class TodosArray extends ModelArray {
  constructor(models, options = {}) {
    super(models, Object.assign(options, { model: TodoModel, comparator: 'order' }));
  }

  completed() {
    return this.filter(todo => todo.completed);
  }

  remaining() {
    return this.filter(todo => !todo.completed);
  }

  nextOrder() {
    if (!this.length) return 1;
    return this[this.length - 1].order + 1;
  }
}

export default TodosArray;
