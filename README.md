# Compago

A minimalist framework for building modern web applications using Web
Components.

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

## Overview

### Advanced State Management with Observable

Lit's reactive properties hold UI state in properties and attributes of a Custom
Element, usually as simple strings and numbers. However, reactive properties are
cumbersome to work with when dealing with a complex domain state that involves
large nested objects and arrays. To handle complex domain objects, compago
introduces the `Observable` class that wraps a given object and turns it into a
proxy that reacts to changes on the object and all its nested objects with a
`change` event. Using `ObserverElement` and `bond` directive, one can extend
`LitElement` to work seamlessly with observables providing two-way binding:

```typescript
import { html, LitElement } from "lit";
import { bond, Observable, ObserverElement } from "compago";

class Todo {
  description = "";
  done = false;
}

class TodoItem extends ObserverElement<Todo> {
  connectedCallback() {
    super.connectedCallback();
    // Create an observable of a Todo object
    // and set it as the observable state (`$`) of our element.
    // Now any change to the observable state will update the element.
    this.$ = new Observable(new Todo());
  }
  render() {
    return html`
      <div>
        <input .value=${this.$!.description}
          <-- Bind the input value to the 'description' property of our observable -->
          @input=${bond({ to: "$.description" })} />
        <input type="checkbox" ?checked=${this.$!.done}
          <-- Bind the 'checked' attribute of the input to the 'done' property of our observable -->
          @click=${bond({ to: "$.done", attirubute: "checked" })} />
      </div>
    `;
  }
}
```

## License

MIT @ Maga D. Zandaqo
