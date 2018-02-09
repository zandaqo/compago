## Classes

<dl>
<dt><a href="#Controller">Controller</a> ⇐ <code><a href="#Listener">Listener</a></code></dt>
<dd><p>The Controller in MVC.
It manages its Model and View while handling user interactions. Controller handles user input
through DOM events and updates its Model accordingly. It listens to updates on its Model
to re-render its View.</p>
</dd>
<dt><a href="#Listener">Listener</a></dt>
<dd></dd>
<dt><a href="#ModelArray">ModelArray</a> ⇐ <code>Array</code></dt>
<dd><p>Manages an ordered set of models providing methods to create, sort, and dispose of the models.</p>
</dd>
<dt><a href="#Model">Model</a> ⇐ <code><a href="#Listener">Listener</a></code></dt>
<dd><p>The Model in MVC.
It manages data and business logic. Models handle synchronization with a persistence layer
through storage controllers and notify subscribers through events when their data is changed.</p>
</dd>
<dt><a href="#RemoteStorage">RemoteStorage</a> ⇐ <code><a href="#Listener">Listener</a></code></dt>
<dd><p>Facilitates interaction with a REST server through the Fetch API.</p>
</dd>
<dt><a href="#Router">Router</a> ⇐ <code><a href="#Listener">Listener</a></code></dt>
<dd><p>Handles client-side routing and navigation utilizing the History API.</p>
</dd>
</dl>

<a name="Controller"></a>

## Controller ⇐ [<code>Listener</code>](#Listener)
The Controller in MVC.
It manages its Model and View while handling user interactions. Controller handles user input
through DOM events and updates its Model accordingly. It listens to updates on its Model
to re-render its View.

**Kind**: global class  
**Extends**: [<code>Listener</code>](#Listener)  

* [Controller](#Controller) ⇐ [<code>Listener</code>](#Listener)
    * [new Controller([options])](#new_Controller_new)
    * [.render()](#Controller+render) ⇒ <code>HTMLElement</code>
    * [.delegate([name], [callback], [selector])](#Controller+delegate) ⇒ <code>this</code>
    * [.undelegate([name], [callback], [selector])](#Controller+undelegate) ⇒ <code>this</code>
    * [.show(region, content, [options])](#Controller+show) ⇒ <code>this</code>
    * [.renderRegion(regionElement, [content])](#Controller+renderRegion) ⇒ <code>this</code>
    * [.dispose([options])](#Controller+dispose) ⇒ <code>this</code>

<a name="new_Controller_new"></a>

### new Controller([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.el] | <code>HTMLElement</code> \| <code>string</code> | the DOM element for the controller |
| [options.tagName] | <code>string</code> | a tag if the controller should create its own DOM element |
| [options.attributes] | <code>Object</code> | attributes to apply to the controller's DOM element |
| [options.handlers] | <code>Object</code> | the DOM event handlers for the controller |
| [options.model] | <code>Object</code> | the data model used by the controller |
| [options.view] | <code>Object</code> | the view or template function used in rendering the controller |
| [options.renderEvents] | <code>string</code> | the model events that cause the controller to re-render |
| [options.renderAttributes] | <code>Array</code> | the attributes of the controller's element                                          that cause it to re-render |
| [options.renderDebounce] | <code>number</code> | time in milliseconds to delay the rendering |
| [options.regions] | <code>Object</code> | a hash of regions of the controller |

<a name="Controller+render"></a>

### controller.render() ⇒ <code>HTMLElement</code>
Renders the controller.

By default, invokes `this.view` supplying the controller
and returns the controller's DOM element.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: <code>HTMLElement</code> - the DOM element of the controller  
<a name="Controller+delegate"></a>

### controller.delegate([name], [callback], [selector]) ⇒ <code>this</code>
Attaches a handler to an event.

If no event or callback is provided, attaches all handlers
   in `this.handlers` to the appropriate events.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>string</code> | the event name |
| [callback] | <code>function</code> \| <code>string</code> | the handler function. Can be either a function                                      or a name of the controller's method |
| [selector] | <code>string</code> | the CSS selector to handle events on a specific child element |

**Example**  
```js
controller.delegate();
// attaches all event handlers specified in `controller.handlers` to their appropriate events

controller.delegate('click', controller.onClick);
// attaches `controller.onClick` as handler for any `click`
// event on the controller's DOM element and its children

controller.delegate('click', controller.onButtonClick, '#button');
// attaches `controller.onButtonClick` as a handler for the `click`
// event on the `#button` child element
```
<a name="Controller+undelegate"></a>

### controller.undelegate([name], [callback], [selector]) ⇒ <code>this</code>
Detaches event handlers.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>string</code> | the event name |
| [callback] | <code>function</code> | the handler function |
| [selector] | <code>string</code> | the CSS selector |

**Example**  
```js
controller.undelegate();
// detaches all DOM event handlers of the controller

controller.undelegate('click', controller.onClick);
// removes `controller.onClick` as a handler for the `click` event

controller.undelegate('click', controller.onButtonClick, '#button');
// removes `controller.onButtonClick` as a handler
// for the `click` events on `#button` child element
```
<a name="Controller+show"></a>

### controller.show(region, content, [options]) ⇒ <code>this</code>
Renders a controller or any DOM element inside a region replacing the existing content.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| region | <code>string</code> |  | the name of the region |
| content | [<code>Controller</code>](#Controller) \| <code>HTMLElement</code> |  | a DOM element or a controller to render |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any event |
| [options.keep] | <code>boolean</code> | <code>false</code> | whether to avoid disposing the previous controller |
| [options.keepModel] | <code>boolean</code> | <code>false</code> | whether to avoid disposing the previous controller's model |

**Example**  
```js
controller.show('sidebar', otherController);
// renders and inserts the otherController's DOM element inside
// the 'sidebar' region of the controller

controller.show('sidebar', yetAnotherController);
// disposes the current controller and replaces it with the new controller

controller.show('sidebar', anotherController);
// returns if the controller did not change

controller.show('sidebar', otherController, { keep: true });
// replaces the previous controller without disposing it

controller.show('sidebar', otherController, { keepModel: true });
// replaces the previous controller without disposing it's model
```
<a name="Controller+renderRegion"></a>

### controller.renderRegion(regionElement, [content]) ⇒ <code>this</code>
Renders content inside a region.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| regionElement | <code>HTMLElement</code> | the DOM element serving as a container for a region |
| [content] | <code>HTMLElement</code> | DOM elements to render inside the region |

<a name="Controller+dispose"></a>

### controller.dispose([options]) ⇒ <code>this</code>
Prepares the controller to be disposed.

Removes the controller's element from the DOM, detaches handlers,
disposes the controller's model unless `save` option is provided,
and removes all event listeners.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing `dispose` event |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing the model of the controller |

<a name="Listener"></a>

## Listener
**Kind**: global class  

* [Listener](#Listener)
    * [new Listener(Base)](#new_Listener_new)
    * [.on(obj, name, callback)](#Listener.on) ⇒ <code>this</code>
    * [.off([obj], [name], [callback])](#Listener.off) ⇒ <code>this</code>
    * [.emit(name, [data], [emitter])](#Listener.emit) ⇒ <code>this</code>
    * [.free()](#Listener.free) ⇒ <code>this</code>

<a name="new_Listener_new"></a>

### new Listener(Base)
Provides methods for event handling.

**Returns**: <code>class</code> - a new Listener class extending the base class  

| Param | Type | Description |
| --- | --- | --- |
| Base | <code>class</code> | the base class to extend with Listener |

<a name="Listener.on"></a>

### Listener.on(obj, name, callback) ⇒ <code>this</code>
Adds an event listener for the specified event(s).

The `callback` will be called with `this` being the listener
whenever `obj` emits the `name` event.

**Kind**: static method of [<code>Listener</code>](#Listener)  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | the object to listen to |
| name | <code>string</code> | the event name or names separated by whitespace |
| callback | <code>function</code> | the function to be called when the event is emitted |

**Example**  
```js
Controller.on(Model, 'change', Controller.render);
// `Controller.render` will be invoked with `this` set to the Controller
// when Model emits a `change` event.

Collection.on(Model, 'add remove', Collection.count);
// `Collection.count` will be invoked every time the Model emits an `add` or a `remove` event.
```
<a name="Listener.off"></a>

### Listener.off([obj], [name], [callback]) ⇒ <code>this</code>
Removes event listeners set up by the host object on other objects.

**Kind**: static method of [<code>Listener</code>](#Listener)  

| Param | Type | Description |
| --- | --- | --- |
| [obj] | <code>Object</code> | the object to stop listening to |
| [name] | <code>string</code> | the event name or names |
| [callback] | <code>function</code> | the callback function to be removed |

**Example**  
```js
Controller.off();
// the Controller no longer listens to any event on any object.

Controller.off(Model);
// the Controller no longer listens to any event on the Model.

Controller.off(Model, 'change');
// no callback will be invoked when the Model emits a `change` event.

Controller.off(Model, 'change', this.render);
// `this.render` won't be invoked when the Model emits a `change` event.
```
<a name="Listener.emit"></a>

### Listener.emit(name, [data], [emitter]) ⇒ <code>this</code>
Emits `name` and `all` events invoking all the callbacks subscribed to the events.

**Kind**: static method of [<code>Listener</code>](#Listener)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | the event name |
| [data] | <code>Object</code> | the hash of additional parameters that are sent to event listeners |
| [emitter] | <code>Object</code> | the emitter of the event |

**Example**  
```js
Controller.on(Model, 'change', Controller.render);
Model.emit('change');
// `Controller.render` is invoked with a parameter: `{event: 'change', emitter: Model}`

Model.emit('change', {previous: 'Zaphod'});
// `Controller.render` is invoked with a parameter
   `{event: 'change', emitter: Model, previous: 'Zaphod'}`

Collection.emit('change', {}, Model);
// the third argument can be used to change event emitter,
// listeners will be invoked with a parameter `{event: 'change', emitter: Model}`
```
<a name="Listener.free"></a>

### Listener.free() ⇒ <code>this</code>
Removes all callbacks bound by other objects to the host object.

It is used to easily dispose of the object.

**Kind**: static method of [<code>Listener</code>](#Listener)  
**Example**  
```js
Controller.on(Model, 'change', this.render);
Collection.on(Model, 'all', this.update);
Model.free();
// both event listeners are now removed
// equivalent to `Collection.off(Model), Controller.off(Model)`
```
<a name="ModelArray"></a>

## ModelArray ⇐ <code>Array</code>
Manages an ordered set of models providing methods to create, sort, and dispose of the models.

**Kind**: global class  
**Extends**: <code>Array</code>  

* [ModelArray](#ModelArray) ⇐ <code>Array</code>
    * [new ModelArray([models], [options])](#new_ModelArray_new)
    * [.set(models, options)](#ModelArray+set) ⇒ <code>this</code>
    * [.unset(models, [options])](#ModelArray+unset) ⇒ <code>this</code>
    * [.push(models, [options])](#ModelArray+push) ⇒ <code>this</code>
    * [.pop([options])](#ModelArray+pop) ⇒ [<code>Model</code>](#Model)
    * [.unshift(models, [options])](#ModelArray+unshift) ⇒ <code>this</code>
    * [.shift([options])](#ModelArray+shift) ⇒ [<code>Model</code>](#Model)
    * [.sort([options])](#ModelArray+sort) ⇒ <code>this</code>
    * [.reverse([options])](#ModelArray+reverse) ⇒ <code>this</code>
    * [.splice(start, [deleteCount], [items], [options])](#ModelArray+splice) ⇒ <code>Array</code>
    * [.get(id)](#ModelArray+get) ⇒ [<code>Model</code>](#Model) \| <code>undefined</code>
    * [.where(attributes, [first])](#ModelArray+where) ⇒ [<code>Array.&lt;Model&gt;</code>](#Model)
    * [.read([options])](#ModelArray+read) ⇒ <code>Promise</code>
    * [.toJSON()](#ModelArray+toJSON) ⇒ <code>Array</code>
    * [.sync(method, options)](#ModelArray+sync) ⇒ <code>Promise</code>
    * [.dispose([options])](#ModelArray+dispose) ⇒ <code>this</code>

<a name="new_ModelArray_new"></a>

### new ModelArray([models], [options])

| Param | Type | Description |
| --- | --- | --- |
| [models] | [<code>Array.&lt;Model&gt;</code>](#Model) | models to add to the array |
| [options] | <code>Object</code> |  |
| [options.storage] | <code>Object</code> | the storage controller for the array |
| [options.model] | <code>Object</code> | the class of models in the array |
| [options.comparator] | <code>function</code> \| <code>string</code> | a function or an attribute name                                                   that will be used to sort the array |

<a name="ModelArray+set"></a>

### modelArray.set(models, options) ⇒ <code>this</code>
The general method to modify the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| models | <code>Array</code> \| <code>Object</code> |  | a model, a list of models or objects to be added                                to the array or updated if already present |
| options | <code>Object</code> |  |  |
| [options.at] | <code>number</code> |  | the position at which the model(s) should be placed |
| [options.keep] | <code>boolean</code> | <code>false</code> | whether to avoid removing the models not present                                          in the supplied list |
| [options.skip] | <code>boolean</code> | <code>false</code> | whether to avoid updating existing models |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.unsorted] | <code>boolean</code> | <code>false</code> | whether to avoid sorting the array |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
let modelArray = new ModelArray([model0]);
modelArray.set([model1, model2]);
// resets the array models to `[model1, model2]` emitting `add` events on both models,
// removes and disposes the existing `model0` which emits the `remove` event

modelArray.set(model3, { keep: true });
// adds `model3` to the list of array models without removing the existing models

modelArray.set(model4, { keep: true, at: 0 });
// adds `model4` at the beginning of the array

modelArray.set([model2, model3], { save: true });
// removes all models except `model2` and `model3` from the array without disposing
// the removed models

modelArray.set([model1, model4], { keep: true, unsorted: true });
// avoids sorting the resulting list of models
```
<a name="ModelArray+unset"></a>

### modelArray.unset(models, [options]) ⇒ <code>this</code>
Removes a model or a list of models from the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| models | [<code>Model</code>](#Model) \| [<code>Array.&lt;Model&gt;</code>](#Model) |  | the model(s) to remove from the array |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
let modelArray = new ModelArray([model1, model2]);
modelArray.unset(model1);
// removes `model1` from the array emitting `remove` event and disposes it

modelArray.unset(mode2, { save: true });
// removes `model2` from the array but does not dispose it
```
<a name="ModelArray+push"></a>

### modelArray.push(models, [options]) ⇒ <code>this</code>
Adds a model(s) to the end of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| models | <code>Object</code> \| <code>Array</code> |  | the model(s) or objects to be added to the array. |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.unsorted] | <code>boolean</code> | <code>false</code> | whether to avoid sorting the array |

**Example**  
```js
modelArray.push(model);
// adds model to the end of the array
```
<a name="ModelArray+pop"></a>

### modelArray.pop([options]) ⇒ [<code>Model</code>](#Model)
Removes a model from the end of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Model</code>](#Model) - the removed model  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
modelArray.pop();
// removes the last model from the array, disposes and returns it

modelArray.pop({ save: true });
// removes and returns the last model of the array without disposing it
```
<a name="ModelArray+unshift"></a>

### modelArray.unshift(models, [options]) ⇒ <code>this</code>
Adds a model(s) to the beginning of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| models | <code>Object</code> \| <code>Array</code> |  | the model(s) or objects to be added to the array. |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.unsorted] | <code>boolean</code> | <code>false</code> | whether to avoid sorting the array |

**Example**  
```js
modelArray.unshift(model);
// adds model to the beginning of the array
```
<a name="ModelArray+shift"></a>

### modelArray.shift([options]) ⇒ [<code>Model</code>](#Model)
Removes a model from the beginning of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Model</code>](#Model) - the removed model  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
modelArray.shift();
// removes the first model from the array, disposes and returns it

modelArray.shift({ save: true });
// removes and returns the fist model of the array without disposing it
```
<a name="ModelArray+sort"></a>

### modelArray.sort([options]) ⇒ <code>this</code>
Sorts the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.comparator] | <code>function</code> \| <code>string</code> |  | a comparator function or an attribute name                                                 for sorting |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing the `sort` event |
| [options.descending] | <code>boolean</code> | <code>false</code> | whether to sort in descending order if the comparator is                                        an attribute name |

**Example**  
```js
modelArray.sort();
// attemps to sort the array using its predefined comparator from `this.comparator`
// emitting the `sort` event

modelArray.sort({ comparator: '_id' });
// sorts models according to their `_id` field in ascending order

modelArray.sort({ comparator: '_id', descending: true });
// sorts according to `_id` field in descending order

modelArray.sort({ comparator: (a,b) => a > b });
// sorts according to the provided comparator function
```
<a name="ModelArray+reverse"></a>

### modelArray.reverse([options]) ⇒ <code>this</code>
Reverses the order of the models in the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing the `sort` event |

**Example**  
```js
modelArray.reverse();
// reverses the order of models in the array emitting the `sort` event
```
<a name="ModelArray+splice"></a>

### modelArray.splice(start, [deleteCount], [items], [options]) ⇒ <code>Array</code>
Changes the array in place by removing and/or replacing its models
the same way as Array#splice.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| start | <code>number</code> |  | index at which to start changing the array |
| [deleteCount] | <code>number</code> |  | the number of old array elements to remove,                                defaults to the length of the array |
| [items] | [<code>Model</code>](#Model) \| <code>Object</code> \| <code>Array</code> |  | the models to add to the array,                                        beginning at the start index |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
const modelArray = new ModelArray([model1, model2, model3]);
const result = modelArray.splice(0, 1);
// result is `[model1]`
// modelArray is `[model2, model3]`
```
<a name="ModelArray+get"></a>

### modelArray.get(id) ⇒ [<code>Model</code>](#Model) \| <code>undefined</code>
Gets a model from the array by its id.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Model</code>](#Model) \| <code>undefined</code> - a model or `undefined` if no model is found  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the model's id |

**Example**  
```js
modelArray.get('M123');
// returns a model with id `M123` if it's present in the array
```
<a name="ModelArray+where"></a>

### modelArray.where(attributes, [first]) ⇒ [<code>Array.&lt;Model&gt;</code>](#Model)
Returns models with matching attributes.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Array.&lt;Model&gt;</code>](#Model) - an array of matching models  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attributes | <code>Object</code> |  | a hash of attributes to match models against |
| [first] | <code>boolean</code> | <code>false</code> | whether to return the first matching model |

**Example**  
```js
modelArray.where({ day: 'monday', author: 'Joe'});
// returns all models whose `day` and `author` attributes values equal
// `monday` and `Joe`, respectively

modelArray.where({ day: 'monday' }, true);
// returns the first matching model
```
<a name="ModelArray+read"></a>

### modelArray.read([options]) ⇒ <code>Promise</code>
Updates the array with its stored version.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.success] | <code>function</code> |  | the success callback |
| [options.error] | <code>function</code> |  | the error callback |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing events |

**Example**  
```js
modelArray.read()
 .then((response) => console.log(response))
 .catch((error) => console.log(error));
// updates the array with the stored version and logs the response if successful,
// otherwise logs the error
```
<a name="ModelArray+toJSON"></a>

### modelArray.toJSON() ⇒ <code>Array</code>
Creates a copy of the array's models for JSON stringification.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: <code>Array</code> - an array of stringified models  
<a name="ModelArray+sync"></a>

### modelArray.sync(method, options) ⇒ <code>Promise</code>
The general method to synchronize the array.
Proxies to the `sync` method of the storage if it's specified.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | the internal method name. |
| options | <code>Object</code> |  |

<a name="ModelArray+dispose"></a>

### modelArray.dispose([options]) ⇒ <code>this</code>
Prepares the array to be disposed.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing `dispose` event |
| [options.save] | <code>boolean</code> | <code>false</code> | whether to avoid disposing removed models |

**Example**  
```js
modelArray.dispose();
// disposes the array disposing all its models and emitting the `dispose` event

modelArray.dispose({ save: true });
// disposes the array without disposing its models
```
<a name="Model"></a>

## Model ⇐ [<code>Listener</code>](#Listener)
The Model in MVC.
It manages data and business logic. Models handle synchronization with a persistence layer
through storage controllers and notify subscribers through events when their data is changed.

**Kind**: global class  
**Extends**: [<code>Listener</code>](#Listener)  

* [Model](#Model) ⇐ [<code>Listener</code>](#Listener)
    * [new Model([attributes], [options])](#new_Model_new)
    * _instance_
        * [.id](#Model+id) : <code>\*</code>
        * [.set([attributes])](#Model+set) ⇒ <code>this</code>
        * [.assign(attributes)](#Model+assign) ⇒ <code>this</code>
        * [.merge(source, [target])](#Model+merge) ⇒ <code>Object</code>
        * [.toJSON()](#Model+toJSON) ⇒ <code>Object</code>
        * [.read([options])](#Model+read) ⇒ <code>Promise</code>
        * [.write([options])](#Model+write) ⇒ <code>Promise</code>
        * [.erase([options])](#Model+erase) ⇒ <code>Promise</code>
        * [.sync(method, options)](#Model+sync) ⇒ <code>Promise</code>
        * [.dispose([options])](#Model+dispose) ⇒ <code>this</code>
    * _static_
        * [.idAttribute](#Model.idAttribute) : <code>string</code>
        * [.proxies](#Model.proxies) : <code>WeakMap</code>
        * [.definePrivate(model, properties)](#Model.definePrivate) ⇒ <code>void</code>

<a name="new_Model_new"></a>

### new Model([attributes], [options])

| Param | Type | Description |
| --- | --- | --- |
| [attributes] | <code>Object</code> | the attributes to be set on a newly created model |
| [options] | <code>Object</code> |  |
| [options.collection] | <code>Object</code> | the collection to which the model should belong |
| [options.storage] | <code>Object</code> | the storage engine for the model |

<a name="Model+id"></a>

### model.id : <code>\*</code>
The model's permanent `id`.

**Kind**: instance property of [<code>Model</code>](#Model)  
<a name="Model+set"></a>

### model.set([attributes]) ⇒ <code>this</code>
Resets all attributes on the model with given attributes.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| [attributes] | <code>Object</code> | the attributes to be set on the model |

**Example**  
```js
model.set();
// all attributes are removed from the model

model.set({ foo: bar });
model
//=>{ foo: bar }
```
<a name="Model+assign"></a>

### model.assign(attributes) ⇒ <code>this</code>
Assigns given attributes to the model.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| attributes | <code>Object</code> | the attributes to be assigned to the model |

<a name="Model+merge"></a>

### model.merge(source, [target]) ⇒ <code>Object</code>
Merges two objects, if no target object proveded merges given source object to the model's
attributes.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Object</code> - the target object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Object</code> |  | the source object to be merged with the target object. |
| [target] | <code>Object</code> | <code>this</code> | the target object to be merged, uses model's attributes by                                    default |

<a name="Model+toJSON"></a>

### model.toJSON() ⇒ <code>Object</code>
Returns a copy of the model's attributes for JSON stringification.

**Kind**: instance method of [<code>Model</code>](#Model)  
<a name="Model+read"></a>

### model.read([options]) ⇒ <code>Promise</code>
Resets the model's state from the storage.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid emitting events |
| [options.skip] | <code>boolean</code> | <code>false</code> | whether to avoid updating existing attributes                                with the received ones |
| [options.method] | <code>string</code> | <code>&quot;assign&quot;</code> | the name of the method to update existing attributes |

**Example**  
```js
model.read().then((response) => console.log(response)).catch((error) => console.log(error));
// updates the model with the stored version and logs the response if successful,
// otherwise logs the error

model.read({ skip: true });
// skips updating the model with the received attributes

model.read({ method: 'merge' });
// merges received attributes with the existing ones instead of assigning them
```
<a name="Model+write"></a>

### model.write([options]) ⇒ <code>Promise</code>
Saves the model into the storage. If the storage responds with an object, updates the model
with the response object.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid emitting events |
| [options.skip] | <code>boolean</code> | <code>false</code> | whether to avoid updating existing attributes                                 with the received ones |
| [options.method] | <code>string</code> | <code>&quot;assign&quot;</code> | the name of the method to update existing attributes |

**Example**  
```js
model.write().then((response) => console.log(response)).catch((error) => console.log(error));
// writes the model into the storage and logs the response if successful,
// otherwise logs the error

model.write({ skip: true });
// skips updating the model with the received attributes

model.write({ method: 'merge' });
// merges received attributes with the existing ones instead of assigning them
```
<a name="Model+erase"></a>

### model.erase([options]) ⇒ <code>Promise</code>
Removes the model from the storage.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid emitting events |
| [options.keep] | <code>boolean</code> | <code>false</code> | whether to avoid disposing the model after erasing |

**Example**  
```js
model.erase().then((response) => console.log(response)).catch((error) => console.log(error));
// removes the stored version of the model and logs the response if successful,
// otherwise logs the error
```
<a name="Model+sync"></a>

### model.sync(method, options) ⇒ <code>Promise</code>
The general method to synchronize the model.
Proxies to the `sync` method of the storage if it is specified.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | the internal method name |
| options | <code>Object</code> | the options to be sent to the `sync` method of the storage |

<a name="Model+dispose"></a>

### model.dispose([options]) ⇒ <code>this</code>
Prepares the model to be disposed by removing all listeners
set up by the model or on the model.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing the `dispose` event |

**Example**  
```js
model.dispose();
// prepares the model for disposal
```
<a name="Model.idAttribute"></a>

### Model.idAttribute : <code>string</code>
The id property name for the models of the class.

**Kind**: static property of [<code>Model</code>](#Model)  
<a name="Model.proxies"></a>

### Model.proxies : <code>WeakMap</code>
The WeakMap holding references to metadata associated with proxies in Model.

**Kind**: static property of [<code>Model</code>](#Model)  
<a name="Model.definePrivate"></a>

### Model.definePrivate(model, properties) ⇒ <code>void</code>
Given a hash of property names and their initial values,
sets them up on the given model as non-enumerable and non-configurable properties
defined by Symbols in the global storage, where Symbol keys correspond to givn property names.

**Kind**: static method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| model | [<code>Model</code>](#Model) | the model on which properties are to be set |
| properties | <code>Object</code> | a hash of Symbol key names and initial values to be set on the model |

**Example**  
```js
Model.definePrivate(model, { private_key: 1 });
model[Symbol.for('private_key')]
//=> 1
```
<a name="RemoteStorage"></a>

## RemoteStorage ⇐ [<code>Listener</code>](#Listener)
Facilitates interaction with a REST server through the Fetch API.

**Kind**: global class  
**Extends**: [<code>Listener</code>](#Listener)  

* [RemoteStorage](#RemoteStorage) ⇐ [<code>Listener</code>](#Listener)
    * [new RemoteStorage([options])](#new_RemoteStorage_new)
    * _instance_
        * [.sync(method, model, options)](#RemoteStorage+sync) ⇒ <code>Promise</code>
        * [.dispose([options])](#RemoteStorage+dispose) ⇒ <code>this</code>
    * _static_
        * [.methods](#RemoteStorage.methods)
        * [.isStored(model)](#RemoteStorage.isStored) ⇒ <code>boolean</code>

<a name="new_RemoteStorage_new"></a>

### new RemoteStorage([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.url] | <code>string</code> | the base URL for requests, by default uses the window's origin |
| [options.init] | <code>Object</code> | an options object for custom settings                                to use as the `init` parameter in calls to the global fetch() |

<a name="RemoteStorage+sync"></a>

### remoteStorage.sync(method, model, options) ⇒ <code>Promise</code>
The general method for synchronization.

**Kind**: instance method of [<code>RemoteStorage</code>](#RemoteStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| method | <code>string</code> |  | a method name to execute.                   Internal method names are mapped to HTTP methods in `RemoteStorage.methods`. |
| model | [<code>Model</code>](#Model) \| <code>Collection</code> \| [<code>ModelArray</code>](#ModelArray) |  | a model or a collection to be synchronized |
| options | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing any events |
| [options.patch] | <code>Boolean</code> |  | whether to send only changed attributes (if present)                                  using the `PATCH` method |
| [options.url] | <code>string</code> |  | a specific url for the request,                               in case it's different from the default url of the storage |
| [options.init] | <code>Object</code> |  | an options object for custom settings                                to use as the `init` parameter in calls to the global fetch() |

<a name="RemoteStorage+dispose"></a>

### remoteStorage.dispose([options]) ⇒ <code>this</code>
Prepares the storage controller to be disposed.

**Kind**: instance method of [<code>RemoteStorage</code>](#RemoteStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid emitting the `dispose` event. |

<a name="RemoteStorage.methods"></a>

### RemoteStorage.methods
The map translating internal method names to their respective HTTP methods.

**Kind**: static property of [<code>RemoteStorage</code>](#RemoteStorage)  
<a name="RemoteStorage.isStored"></a>

### RemoteStorage.isStored(model) ⇒ <code>boolean</code>
Checks whether the model has been already persisted on the server.

**Kind**: static method of [<code>RemoteStorage</code>](#RemoteStorage)  
**Returns**: <code>boolean</code> - True if the model is already stored on the server  

| Param | Type | Description |
| --- | --- | --- |
| model | [<code>Model</code>](#Model) | the model to be checked |

<a name="Router"></a>

## Router ⇐ [<code>Listener</code>](#Listener)
Handles client-side routing and navigation utilizing the History API.

**Kind**: global class  
**Extends**: [<code>Listener</code>](#Listener)  

* [Router](#Router) ⇐ [<code>Listener</code>](#Listener)
    * [new Router([options])](#new_Router_new)
    * [.addRoute(name, route)](#Router+addRoute) ⇒ <code>this</code>
    * [.removeRoute(name)](#Router+removeRoute) ⇒ <code>this</code>
    * [.start([options])](#Router+start) ⇒ <code>this</code>
    * [.stop()](#Router+stop) ⇒ <code>this</code>
    * [.navigate(fragment, [options])](#Router+navigate) ⇒ <code>boolean</code>
    * [.dispose([options])](#Router+dispose) ⇒ <code>this</code>

<a name="new_Router_new"></a>

### new Router([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.routes] | <code>Object</code> | a hash of routes |
| [options.root] | <code>string</code> |  |

<a name="Router+addRoute"></a>

### router.addRoute(name, route) ⇒ <code>this</code>
Adds a route to the collection of routes.

**Kind**: instance method of [<code>Router</code>](#Router)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | the route name |
| route | <code>string</code> | the path string |

**Example**  
```js
router.addRoute('home', '/');
// adds a route named home with the path '/' to the routes list so that every time user
// navigates to the root URL the router emit `route:home` event

router.addRoute('profile', '/users/:name');
// if user visits `/users/JohnDoe` router will fire `route:profile`
// with `event.params.name` set to `JohnDoe`
```
<a name="Router+removeRoute"></a>

### router.removeRoute(name) ⇒ <code>this</code>
Removes a route from the collection of routes.

**Kind**: instance method of [<code>Router</code>](#Router)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | the route name to be removed |

**Example**  
```js
router.removeRoute('home');
// if present, route named 'home' will be removed from the routes list
```
<a name="Router+start"></a>

### router.start([options]) ⇒ <code>this</code>
Starts the router enabling it to handle URL changes.

**Kind**: instance method of [<code>Router</code>](#Router)  
**Throws**:

- <code>Error</code> if the support for History API could not be found


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid attempting to load the current URL fragment |

**Example**  
```js
router.start();
// starts to listen to URL changes checking them against the routes list, upon start checks
// the current URL for routes

router.start({ silent: true });
//starts the router without checking the current URL
```
<a name="Router+stop"></a>

### router.stop() ⇒ <code>this</code>
Stops the router preventing it from handling URL changes.

**Kind**: instance method of [<code>Router</code>](#Router)  
<a name="Router+navigate"></a>

### router.navigate(fragment, [options]) ⇒ <code>boolean</code>
Saves a fragment into the browser history.

**Kind**: instance method of [<code>Router</code>](#Router)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fragment | <code>string</code> |  | a properly URL-encoded fragment to place into the history |
| [options] | <code>Object</code> |  |  |
| [options.replace] | <code>boolean</code> | <code>false</code> | whether to change the current item in the history                                    instead of adding a new one |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid checking the fragment for routes |

**Example**  
```js
router.navigate('/users');
// sets the current URL to '/users', pushes it into history, and checks the new URL for routes

router.navigate('/users', { replace: true });
// replaces the current URL with '/users' and checks it for routes

routes.navigate('/users', { silent: true });
// does not check the new URL for routes
```
<a name="Router+dispose"></a>

### router.dispose([options]) ⇒ <code>this</code>
Prepares the router to be disposed.

**Kind**: instance method of [<code>Router</code>](#Router)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.silent] | <code>boolean</code> | <code>false</code> | whether to avoid firing `dispose` event |

**Example**  
```js
router.dispose();
// stops the router, removes the routes and event listeners
```
