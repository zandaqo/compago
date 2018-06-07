# Compago

[![npm](https://img.shields.io/npm/v/compago.svg?style=flat-square)](https://www.npmjs.com/package/compago)
[![David-dm](https://david-dm.org/zandaqo/compago.svg?style=flat-square)](https://david-dm.org/zandaqo/compago)
[![Travis branch](https://img.shields.io/travis/zandaqo/compago.svg?style=flat-square)](https://travis-ci.org/zandaqo/compago)
[![Codecov](https://img.shields.io/codecov/c/github/zandaqo/compago.svg?style=flat-square)](https://codecov.io/github/zandaqo/compago)

A minimalist MVC framework for building web applications using the power of modern web technologies.
Compago evolved from [Backbone.js](http://backbonejs.org) with which it shares the general approach 
to architecture.


## Features
 * Built for modern browsers: No support for IE.
 * No large dependencies such as jQuery, underscore, etc.
 * Small size (5kb) and API surface.
 * No custom event or messaging system; all components extend [EventTarget](https://medium.com/@zandaqo/eventtarget-the-future-of-javascript-event-systems-205ae32f5e6b), thus, relying on DOM events for communication.
 * Encourages strict implementation of MVC architecture and separation of concerns.
 * Strict control of the life-cycle of its objects through the use of class constructors and `dispose` methods as destructors.
 * And all other features expected from a modern MV* framework:
   * one-way data binding and data synchronization;
   * declarative handling of DOM events;
   * non-opinionated approach to the View layer that allows the use of any rendering or templating engine (i.e. React, lit-html, etc.);
   * simple routing that uses Express-style path strings.


## Installation
Install it from npm repository:
```
npm i compago
```

and import modules as needed:
```js
import { Model, Controller } from 'compago';
```

#### Notes on testing:
Using Compago with Node.js based testing tools may require some tinkering since Compago relies on modern DOM
and uses ECMAScript Modules. To see a fully set up Jest test environment check out [compago-todo](https://github.com/zandaqo/compago-todo).


## Overview
Out of the box, Compago offers Model and Controller of the Model-View-Controller trifecta. The View is left for the developer to choose;
Compago's Controller simply expects a function that accepts the controller as a parameter and, by default, will invoke it on every render.
There is also ModelArray to handle collections of Models, and RemoteStorage as a storage driver for Model to synchronize data with REST servers.
All components communicate with each other through DOM events using methods of EventTarget interface which they all extend.

### Model
Models store your data and business logic that isn't tied to UI. They keep track of changes on data and handle data synchronization.
Internally, they are implemented using Proxies. You can treat your model instances as normal objects,
but anytime you change an enumerable property of the model (or any "nested" object or array within it) the model will emit a "change" event specifying
its previous value and "path" to it:

```
const model = new Model();
model.a = {};
// a CustomEvent "change" emitted with { detail: { emitter: model, path: ':a', previous: undefined } }
model.a.b = 1;
// a CustomEvent "change" emitted with { detail: { emitter: model, path: ':a:b', previous: undefined } }
```

Only enumerable own properties are tracked or serialized for storage, thus, getters, setters, class methods,
or data properties set to be non-enumerable can be used to implement private properties, computed properties, and so forth.
To make setting non-enumerable data properties easy, Model offers a helper function [Model.definePrivate](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model.definePrivate).
Three additional methods, [Model#set](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+set), [Model#assign](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+assign),
and [Model#merge](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+merge) make it easier to mass-change data properties.

Data synchronization uses [Model#read](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+read), [Model#write](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+write),
and [Model#erase](https://github.com/zandaqo/compago/blob/master/docs/API.md#Model+erase) methods to respectively to update the model with a stored version, to save the model, or to remove it from the storage.
Internally, all methods serialize and relay Model's data to storage drivers such as [RemoteStorage](https://github.com/zandaqo/compago/blob/master/docs/API.md#remotestorage--eventtarget).
The RemoteStorage class uses Fetch API to interact with REST servers:

```
const todoRestStorage = new RemoteStorage({ url: 'http://example.com/todos' });

const model = new Model({}, {
  storage: todoRestStorage
});
await model.write();
// sends POST request to http://example.com/todos with serialized data to create a new model on the server

model.a = 1;
await model.write();
// updates the stored model with the current model sending a PUT request

await model.read();
// updates the current model from the storage

await model.erase();
// removes the model from the storage
```

### Controller
Controllers handle user interactions and glue together Models and Views. The current Controller class is written with CustomElements in mind to one day seamlessly integrate with them.
For now, each Controller is tied to a DOM element that serves as the parent element for rendering its View. Controller reacts to DOM events passing through the said element (emitted by it or its children) updating Model and re-rendering View as need be.

#### Observing Attributes
In `Controller.observedAttributes` class property, you can specify attribute names of the controller's element
or property names of the controller's model to be watched for changes. Every time such change happens, the controller will emit `attributes` event with necessary data attached.
Now, watching for changes both on Model and DOM attributes may seem redundant, but that's a deliberate choice to keep Model free of UI logic:
UI state should be kept in DOM while the business data in your Models. Also, this way you can have UI specific controllers with a state without a model.

#### Event Handling
Controller provide a declarative event handling interface that takes care of managing DOM events.

```
class Todo extends Controller {
  constructor() {
    super({
      el: '#todo'
      handlers: {
        'click': 'onClick',
        'click .submit': 'onSubmit',
        'attributes': 'render',
      }
    });
  }
  onClick(event) {}
  onSubmit(event, target) {}

  static get observedAttributes() {
    return ['data-name']
  }
}
```

In the above example, Controller will attach a single handler `Controller#_handle` to the controller's DOM element to handle `click` events
and another one to handle `attributes` event that will be emitted if the element's attribute `data-name` changes.
It will invoke `onClick` whenever a click happens inside the element, and `onSubmit` whenever that click happens on a child element that matches `.submit`
selector, the second argument (target) supplied to `onSubmit` method will be the matched element. Also, this way you don't have to bind your handlers to their instances.
The attaching or detaching of the event handlers happens only once upon creation or destruction of the controller respectively. You can still add event handlers
the usual way with `addEventListener` or delegate this entirely to your View engine if it offers such feature.

#### Routing
A controller can act as a router watching for changes in URL and emitting `route` events if the URL match specified routes.

```
class Todo extends Controller {
  constructor() {
    super({
      routes: {
        home: '/'
        filter: '/:filter'
      }
      handlers: {
        route: 'onRouteChange'
      }
    });
  }
  onRouteChange(event) {}
}
```

In the above example, the controller will `route` event if URL matches one of the specified routes. Since the controller also
has a handler for the route event, it will invoke the handler as well with data specifying the name of route and other parameters.

#### Managing Nested Controllers
Controller uses the concept of regions to manage nested controllers. A region is a DOM element within the controller's element that can host another controller.
The main reason for having regions is to make sure that we dispose of child controllers when we remove the parent controller. To that end, controller offers an interface
to speficy regions and a single `Controller#show` method to include child controllers within a given region.

```
class Dashboard extends Controller {
  constructor() {
    super({
      regions: {
        menu: '#menu',
        content: '#content',
      }
    }
  }

  render() {
    if (!this.el.hasChildren() {
      this.show('menu', new Menu());
      this.show('content', new Content());
    }
  }
}
```

In the above example we specify two regions tied to two elements within the Dashboard controller and fill each with controller upon first render of the Dashboard.
If we call `show` again:

```
...
this.show('content', new OtherContent());
...
```

the Dashboard controller will dispose of the old Content controller and fill the `#content` with the new OtherContent controller.


## See Also
 * [API Documentation](https://github.com/zandaqo/compago/blob/master/docs/API.md)
 * [compago-todo](https://github.com/zandaqo/compago-todo) An example of a Todo app that uses lit-html for Views.
