# Compago

[![Actions Status](https://github.com/zandaqo/compago/workflows/ci/badge.svg)](https://github.com/zandaqo/compago/actions)
[![npm](https://img.shields.io/npm/v/compago.svg?style=flat-square)](https://www.npmjs.com/package/compago)

Compago is a minimalist framework inspired by Domain-Driven Design for building
applications using Web Components.

Although most components are isomorphic and can be used independently, Compago
works best with [Lit](https://lit.dev) for which it offers extensions focused on
simplifying advanced state management in web components.

## Installation

Node.js:

```bash
npm i compago
```

```js
import { ... } from "compago";
```

Components can also be imported separately, to avoid loading extra dependencies,
for example:

```js
import { Result } from "compago/result";
import { Observable } from "compago/observable";
```

Deno:

```js
import { ... } from "https://raw.githubusercontent.com/zandaqo/compago/master/mod.ts"
```

## State Management with Observables

UI frameworks like React and Lit provide built-in mechanisms to deal with simple
UI state expressed as primitive values such as `useState` hooks in React or
Lit's reactive properties. However, those mechanisms are cumbersome to work with
when dealing with a complex domain state that involves nested objects and
arrays. To give reactivity to complex domain objects, Compago introduces the
`Observable` class. Observable wraps a given domain object into a proxy that
reacts to changes on the object and all its nested structures with a `change`
event. When used in Lit elements, additional helphers like `@observer`,
`@observe` decorators and `bond` directive make reativity and two-way data
binding seamless.

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

`Observable` makes monitoring changes on JavaScript objects as seamless as
possible using the built-in Proxy and EventTarget interfaces. Under the hood,
Observable wraps a given object into a proxy that emits `change` events whenever
a change happens to the object or its "nested" objects and arrays. Since
`Observable` is an extension of DOM's EventTarget, listening to changes is done
through the standard event handling mechanisms.

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

Observables nicely complement Lit element's reactive properties allowing
separation of complex domain state (held in observables) and UI state (held in
properties). To simplify working with observables in Lit element, Compago offers
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
our UI or domain states with them. To simplify the process, Compago offers the
`bond` directive. The directive provides a declarative way to define an event
listener that (upon being triggered) takes the specified value from its DOM
element, optionally validates and parses it, and sets it on desired object, be
it the element itself or a domain state object.

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

## State Persistance with Repositories

A repository is a design pattern of data-centric, domain-driven design that
encapsulates the logic for accessing data sources while abstracting the
underlying persistence technology. Web applications exchange data with a variety
of data sources, such as servers exposed through a RESTful API, local storage
using IndexedDB API, or databases through their respective drivers. Compago
offers a unifying interface for repositories and implementations for RESTful
APIs (`RESTRepository`) and local storage with IndexedDB (`LocalRepository`).

```typescript
import { RESTRepository } from 'compago';

class Comment {
  id = 0;
  text = '';
  meta = {
    author: '';
    date: new Date();
  }
}

// Create a repository for comments that will access the API end point `/comments`
const remoteRepository = new RESTRepository(Comment, '/comments', 'id');

// retrieve the comment with id 1
// by sending a GET request to `/comments/1` API end-point
const readResult = await remoteRepository.read(1);

readResult.ok
//=> true if successful

const comment = readResult.value
//=> Comment {...}
```

## License

MIT @ Maga D. Zandaqo
