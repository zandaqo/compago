# Compago

A minimalist framework for building modern web applications using Web
Components.

[![Actions Status](https://github.com/zandaqo/compago/workflows/ci/badge.svg)](https://github.com/zandaqo/compago/actions)
[![npm](https://img.shields.io/npm/v/compago.svg?style=flat-square)](https://www.npmjs.com/package/compago)

Compago is a collection extensions for [Lit](https://lit.dev) that provide
advanced state management, routing, and localization capabilities.

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

Lit's reactive properties are well-suited for their task: holding UI state in
properties and attributes of a Custom Element, usually in the form of simple
strings and numbers. However, reactive properties are cumbersome to work with
when dealing with a complex domain state that involves large nested objects and
arrays. To handle complex domain objects, compago introduces the `Observable`
class that wraps a given object and turns it into a proxy that reacts to changes
on the object and all its nested objects with a `change` event. Using
`Observing` mixin and `bond` directive, one can extend `LitElement` to work
seamlessly with observables providing two-way binding:

```typescript
import { html, LitElement } from "lit";
import { bond, Observable, Observing } from "compago";

class Todo {
  description = "";
  done = false;
}

class TodoItem extends Observing<Todo>(LitElement) {
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

### Routing with RouterController

Compago includes a router controller not dissimilar in capablities to existing
solutions in other frameworks, yet significantly smaller (~100 LOC).

```typescript
import { html, LitElement } from "lit";
import { RouterController } from "compago";

class Application extends LitElement {
  main = html``;
  router = new RouterController(
    this,
    [
      { name: "home", path: /^\/$/g, action: this.onHome },
      // this will create x-settings element and assign it to the main property
      { name: "settings", path: /^\/settings\/?$/g, component: "x-settings" },
      {
        name: "user",
        // we use RegExp group called 'id' as a URL parameter that will be supplied to
        // x-user component in `location.params`
        path: /^\/users\/(?<id>[^/]+)/g,
        // optionally we can dynamically load the x-user component from a file
        // when the route is invoked
        load: "./x-user.js",
        component: "x-user",
      },
      // the fallback route
      { name: "missing", path: /^.*$/g, component: "x-missing" },
    ],
    "main", // the host property to which the created components are assigned
    "", // the base path of the router, setting allows creating path specific or "child" routers
  );
  onHome() {
    this.main = html`Welcome home!`;
  }
  render() {
    return html`<div>${this.main}</div>`;
  }
}

// in user.ts
import { RouteDetail } from "compago";

class User extends LitElement {
  // location object holding route details is supplied by router when creating the element
  location?: RouteDetail<{ id?: string }>;
  id?: string;
  connectedCallback() {
    if (this.location) this.id = this.location.params.id;
    super.connectedCallback();
  }
}
```

## License

MIT @ Maga D. Zandaqo
