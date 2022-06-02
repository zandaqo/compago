# Compago

[![Actions Status](https://github.com/zandaqo/compago/workflows/ci/badge.svg)](https://github.com/zandaqo/compago/actions)
[![npm](https://img.shields.io/npm/v/compago.svg?style=flat-square)](https://www.npmjs.com/package/compago)

Compago is a collection of extensions for [Lit](https://lit.dev) that provide
advanced state management.

## Installation

Node.js:

```bash
npm i compago
```

```javascript
import { ... } from "compago";
```

Deno:

```javascript
import { ... } from "https://raw.githubusercontent.com/zandaqo/compago/master/mod.ts"
```

## Advanced State Management with Observable

Lit's reactive properties hold UI state in properties and attributes of a Custom
Element as simple strings and numbers. However, reactive properties are
cumbersome to work with when dealing with a complex domain state that involves
large nested objects and arrays. To handle complex domain objects, compago
introduces the `Observable` class that wraps a given object into a proxy that
reacts to changes on the object and all its nested objects with a `change`
event. Using `@observer`, `@observe` decorators and `bond` directive, one can
work seamlessly with observables providing two-way binding.

### Quick Example

```typescript
import { html, LitElement } from "lit";
import { bond, Observable, observe, observer } from "compago";

class Todo {
  description = "";
  done = false;
}

@observer()
class TodoItem extends LitElement {
  // Create an observable of a Todo object tied to the element.
  // The observable will be treated as internal state and updates within the observable
  // (and all nested objects) will be propagated
  // through the usual lifecycle of reactive properties.
  @observe()
  state = new Observable(new Todo());

  // You can hook into updates to the observable properties just like reactive ones.
  // Names for the nested properties are given as a path, e.g. `state.done`, `state.description`
  protected updated(changedProperties: Map<string, unknown>) {
    // check if the description of the todo has changed
    if (changedProperties.has("state.description")) {
      console.log("Todo description has changed!");
    }
  }

  render() {
    return html`
      <div>
        <input .value=${this.state.description}
          <-- Bind the input value to the 'description' property of our observable -->
          @input=${bond({ to: this.state, key: "description" })} />
        <input type="checkbox" ?checked=${this.state.done}
          <-- Bind the 'checked' attribute of the input to the 'done' property of our observable -->
          @click=${
      bond({ to: this.state, key: "done", attirubute: "checked" })
    } />
      </div>
    `;
  }
}
```

### Observables

`Observable` makes changing and monitoring the changes on JavaScript objects as
seamless as possible using built-in Proxy and EventTarget interfaces. Under the
hood, Observable simply wraps a given object into a proxy that emits "standard"
`change` events whenever a change happens to the object or its "nested" objects.
Since `Observable` is an extension of `EventTarget`, listening to changes is
done through standard event handling methods
`addEventListener`/`removeEventListener`.

```ts
import { Observable } from "compago";

class Todo {
  description = "...";
  done = false;
}

const todo = new Observable(new Todo());

todo.addEventListener("change", (event) => {
  console.log(event);
});

todo.done;
//=> false

todo.done = true;
//=> ChangeEvent {
//=>  type: 'change',
//=>  kind: 'SET'
//=>  path: '.done'
//=>  previous: false,
//=>  defaultPrevented: false,
//=>  cancelable: false,
//=>  timeStamp: ...
//=>}
//=> true

todo.done;
//=> true

JSON.stringify(todo);
//=> { "description": "...", "done": true }
```

Observable only monitors own, public, enumberable, non-symbolic properties,
thus, any other sort of properties (i.e. private, symbolic, or non-enumerable)
can be used to manipulate data without triggering `change` events, e.g. to store
computed properties.

### Using Observables with Lit

Observables nicely complement LitElement's reactive properties allowing
separation of complex domain state (held in observables) and UI state. To
simplify working with observables in LitElement, Compago offers
`ObserverElement` mixin or `observer` and `observe` decorators that handle
attaching and detaching from observables and triggering LitElement updates when
observables detect changes.

```ts
import { observer, observe } from 'compago';

class Comment {
  id = 0;
  text = '';
  meta = {
    author: '';
    date: new Date();
  }
}

@observer()
@customElement('comment-element');
class CommentElement extends LitElement {
  // Set up `comment` property to hold a reference to an observable
  // holding a domain state. Any change to the comment will trigger
  // the elements update cycle.
  @observe() comment = new Observable(new Comment()); 
  @property({ type: Boolean }) isEditing = false;
  ...

  updated(changedProperties: PropertyValues<any>): void {
    if (changedProperties.has('comment.text')) {
      // react if the comment's text property has changed
    }
  }
}
```

While decorators are quite popular in the Lit world, you can achieve the same
effect without them by using `ObserverMixin` and specifying list of observables
in a static property:

```ts
const CommentElement = ObserverMixin(class extends LitElement {
  static observables = ['comment'];
  ...
  comment = new Observable(new Comment()); 
  ...
})
```

### Two-Way Data Binding

We often have to take values from DOM elements (e.g. input fields) and update
with them our UI or domain states. To simplify the process, Compago offers the
`bond` directive. The directive offers a declarative way to define an event
listener that upon being triggered takes a specified value from its DOM element,
optionally validates and parses it, and sets it on desired object.

```ts
class CommentElement extends LitElement {
  // Set up `comment` property to hold a reference to an observable
  // holding a domain state. Any change to the comment will trigger
  // the elements update cycle.
  @observe()
  comment = new Observable(new Comment());
  ...
  render() {
    return html`
      <div>
        <input .value=${this.comment.text}
          <-- Upon input event take the input's value, validate it
          and set as the text of our comment -->
          @input=${
            bond({
              to: this.comment,
              key: "text",
              validate: (text) => text.length < 3000,
            })
          } />
      </div>
    `;
  }
}
```

## License

MIT @ Maga D. Zandaqo
