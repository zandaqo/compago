import { Model } from '../../index';

let counter = 0;

class TodoModel extends Model {
  constructor(attributes, options) {
    super(attributes, options);
    this.set({ ...this.defaults(), ...this });
    this.uid = counter;
    counter += 1;
  }

  defaults() {
    return {
      title: 'empty todo...',
      order: this[Symbol.for('c_collection')].nextOrder(),
      completed: false,
    };
  }
}

export default TodoModel;
