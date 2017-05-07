

<a id="Controller"></a>

## Controller
The Controller in MVC.
It manages its Model and View while handling user interactions. Controller handles user input
through DOM events and updates its Model accordingly. It listens to updates on its Model
to re-render its View.

**Kind**: global class  
**Mixes**: [Listener](#Listener)  

* [Controller](#Controller)
    * [new Controller([options])](#new_Controller_new)
    * [.render()](#Controller__render) ⇒ HTMLElement
    * [.delegate([name], [callback], [selector])](#Controller__delegate) ⇒ this
    * [.undelegate([name], [callback], [selector])](#Controller__undelegate) ⇒ this
    * [.show(region, content, [options])](#Controller__show) ⇒ this
    * [.renderRegion(regionElement, [content])](#Controller__renderRegion) ⇒ this
    * [.dispose([options])](#Controller__dispose) ⇒ this
    * [.on(obj, name, callback)](#Controller__on) ⇒ this
    * [.off([obj], [name], [callback])](#Controller__off) ⇒ this
    * [.emit(name, [data], [emitter])](#Controller__emit) ⇒ this
    * [.free()](#Controller__free) ⇒ this

<a id="new_Controller_new"></a>

### new Controller([options])
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td>
    </tr><tr>
    <td>[options.el]</td><td>HTMLElement | string</td><td><p>the DOM element for the controller</p>
</td>
    </tr><tr>
    <td>[options.tagName]</td><td>string</td><td><p>a tag if the controller should create its own DOM element</p>
</td>
    </tr><tr>
    <td>[options.attributes]</td><td>Object</td><td><p>attributes to apply to the controller&#39;s DOM element</p>
</td>
    </tr><tr>
    <td>[options.handlers]</td><td>Object</td><td><p>the DOM event handlers for the controller</p>
</td>
    </tr><tr>
    <td>[options.model]</td><td>Object</td><td><p>the data model used by the controller</p>
</td>
    </tr><tr>
    <td>[options.view]</td><td>Object</td><td><p>the view or template function used in rendering the controller</p>
</td>
    </tr><tr>
    <td>[options.renderEvents]</td><td>string</td><td><p>the model events that cause the controller to re-render</p>
</td>
    </tr><tr>
    <td>[options.renderAttributes]</td><td>Array</td><td><p>the attributes of the controller&#39;s element
                                         that cause it to re-render</p>
</td>
    </tr><tr>
    <td>[options.regions]</td><td>Object</td><td><p>a hash of regions of the controller</p>
</td>
    </tr>  </tbody>
</table>

<a id="Controller__render"></a>

### controller.render() ⇒ HTMLElement
Renders the controller.

By default, invokes `this.view` supplying the controller's element and model if present,
 prepares the controller's regions, and returns the controller's DOM element.

**Kind**: instance method of [Controller](#Controller)  
**Returns**: HTMLElement - the DOM element of the controller  
<a id="Controller__delegate"></a>

### controller.delegate([name], [callback], [selector]) ⇒ this
Attaches a handler to an event.

If no event or callback is provided, attaches all handlers
   in `this.handlers` to the appropriate events.

**Kind**: instance method of [Controller](#Controller)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[name]</td><td>string</td><td><p>the event name</p>
</td>
    </tr><tr>
    <td>[callback]</td><td>function | string</td><td><p>the handler function. Can be either a function
                                     or a name of the controller&#39;s method</p>
</td>
    </tr><tr>
    <td>[selector]</td><td>string</td><td><p>the CSS selector to handle events on a specific child element</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="Controller__undelegate"></a>

### controller.undelegate([name], [callback], [selector]) ⇒ this
Detaches event handlers.

**Kind**: instance method of [Controller](#Controller)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[name]</td><td>string</td><td><p>the event name</p>
</td>
    </tr><tr>
    <td>[callback]</td><td>function</td><td><p>the handler function</p>
</td>
    </tr><tr>
    <td>[selector]</td><td>string</td><td><p>the CSS selector</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="Controller__show"></a>

### controller.show(region, content, [options]) ⇒ this
Renders a controller or any DOM element inside a region replacing the existing content.

**Kind**: instance method of [Controller](#Controller)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>region</td><td>string</td><td></td><td><p>the name of the region</p>
</td>
    </tr><tr>
    <td>content</td><td><a href="#Controller">Controller</a> | HTMLElement</td><td></td><td><p>a DOM element or a controller to render</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any event</p>
</td>
    </tr><tr>
    <td>[options.keep]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing the previous controller</p>
</td>
    </tr><tr>
    <td>[options.keepModel]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing the previous controller&#39;s model</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="Controller__renderRegion"></a>

### controller.renderRegion(regionElement, [content]) ⇒ this
Renders content inside a region.

**Kind**: instance method of [Controller](#Controller)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>regionElement</td><td>HTMLElement</td><td><p>the DOM element serving as a container for a region</p>
</td>
    </tr><tr>
    <td>[content]</td><td>HTMLElement</td><td><p>DOM elements to render inside the region</p>
</td>
    </tr>  </tbody>
</table>

<a id="Controller__dispose"></a>

### controller.dispose([options]) ⇒ this
Prepares the controller to be disposed.

Removes the controller's element from the DOM, detaches handlers,
disposes the controller's model unless `save` option is provided,
and removes all event listeners.

**Kind**: instance method of [Controller](#Controller)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing <code>dispose</code> event</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing the model of the controller</p>
</td>
    </tr>  </tbody>
</table>

<a id="Controller__on"></a>

### controller.on(obj, name, callback) ⇒ this
**Mixes**: [on](#Listener.on)  
<a id="Controller__off"></a>

### controller.off([obj], [name], [callback]) ⇒ this
**Mixes**: [off](#Listener.off)  
<a id="Controller__emit"></a>

### controller.emit(name, [data], [emitter]) ⇒ this
**Mixes**: [emit](#Listener.emit)  
<a id="Controller__free"></a>

### controller.free() ⇒ this
**Mixes**: [free](#Listener.free)  
<a id="ModelArray"></a>

## ModelArray ⇐ Array
Manages an ordered set of models providing methods to create, sort, and dispose of the models.

**Kind**: global class  
**Extends**: Array  
**Mixes**: [Listener](#Listener)  

* [ModelArray](#ModelArray) ⇐ Array
    * [new ModelArray([models], [options])](#new_ModelArray_new)
    * [.set(models, options)](#ModelArray__set) ⇒ this
    * [.unset(models, [options])](#ModelArray__unset) ⇒ this
    * [.push(models, [options])](#ModelArray__push) ⇒ this
    * [.pop([options])](#ModelArray__pop) ⇒ [Model](#Model)
    * [.unshift(models, [options])](#ModelArray__unshift) ⇒ this
    * [.shift([options])](#ModelArray__shift) ⇒ [Model](#Model)
    * [.sort([options])](#ModelArray__sort) ⇒ this
    * [.reverse([options])](#ModelArray__reverse) ⇒ this
    * [.splice(start, [deleteCount], [items], [options])](#ModelArray__splice) ⇒ Array
    * [.get(id)](#ModelArray__get) ⇒ [Model](#Model) \| undefined
    * [.where(attributes, [first])](#ModelArray__where) ⇒ [Array.&lt;Model&gt;](#Model)
    * [.read([options])](#ModelArray__read) ⇒ Promise
    * [.toJSON()](#ModelArray__toJSON) ⇒ Array
    * [.sync(method, options)](#ModelArray__sync) ⇒ Promise
    * [.dispose([options])](#ModelArray__dispose) ⇒ this
    * [.on(obj, name, callback)](#ModelArray__on) ⇒ this
    * [.off([obj], [name], [callback])](#ModelArray__off) ⇒ this
    * [.emit(name, [data], [emitter])](#ModelArray__emit) ⇒ this
    * [.free()](#ModelArray__free) ⇒ this

<a id="new_ModelArray_new"></a>

### new ModelArray([models], [options])
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[models]</td><td><a href="#Model">Array.&lt;Model&gt;</a></td><td><p>models to add to the array</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td>
    </tr><tr>
    <td>[options.storage]</td><td>Object</td><td><p>the storage controller for the array</p>
</td>
    </tr><tr>
    <td>[options.model]</td><td>Object</td><td><p>the class of models in the array</p>
</td>
    </tr><tr>
    <td>[options.comparator]</td><td>function | string</td><td><p>a function or an attribute name
                                                  that will be used to sort the array</p>
</td>
    </tr>  </tbody>
</table>

<a id="ModelArray__set"></a>

### modelArray.set(models, options) ⇒ this
The general method to modify the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>models</td><td>Array | Object</td><td></td><td><p>a model, a list of models or objects to be added
                               to the array or updated if already present</p>
</td>
    </tr><tr>
    <td>options</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.at]</td><td>number</td><td></td><td><p>the position at which the model(s) should be placed</p>
</td>
    </tr><tr>
    <td>[options.keep]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid removing the models not present
                                         in the supplied list</p>
</td>
    </tr><tr>
    <td>[options.skip]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid updating existing models</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.unsorted]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid sorting the array</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="ModelArray__unset"></a>

### modelArray.unset(models, [options]) ⇒ this
Removes a model or a list of models from the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>models</td><td><a href="#Model">Model</a> | <a href="#Model">Array.&lt;Model&gt;</a></td><td></td><td><p>the model(s) to remove from the array</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
let modelArray = new ModelArray([model1, model2]);
modelArray.unset(model1);
// removes `model1` from the array emitting `remove` event and disposes it

modelArray.unset(mode2, { save: true });
// removes `model2` from the array but does not dispose it
```
<a id="ModelArray__push"></a>

### modelArray.push(models, [options]) ⇒ this
Adds a model(s) to the end of the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>models</td><td>Object | Array</td><td></td><td><p>the model(s) or objects to be added to the array.</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.unsorted]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid sorting the array</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.push(model);
// adds model to the end of the array
```
<a id="ModelArray__pop"></a>

### modelArray.pop([options]) ⇒ [Model](#Model)
Removes a model from the end of the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
**Returns**: [Model](#Model) - the removed model  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.pop();
// removes the last model from the array, disposes and returns it

modelArray.pop({ save: true });
// removes and returns the last model of the array without disposing it
```
<a id="ModelArray__unshift"></a>

### modelArray.unshift(models, [options]) ⇒ this
Adds a model(s) to the beginning of the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>models</td><td>Object | Array</td><td></td><td><p>the model(s) or objects to be added to the array.</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.unsorted]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid sorting the array</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.unshift(model);
// adds model to the beginning of the array
```
<a id="ModelArray__shift"></a>

### modelArray.shift([options]) ⇒ [Model](#Model)
Removes a model from the beginning of the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
**Returns**: [Model](#Model) - the removed model  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.shift();
// removes the first model from the array, disposes and returns it

modelArray.shift({ save: true });
// removes and returns the fist model of the array without disposing it
```
<a id="ModelArray__sort"></a>

### modelArray.sort([options]) ⇒ this
Sorts the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.comparator]</td><td>function | string</td><td></td><td><p>a comparator function or an attribute name
                                                for sorting</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing the <code>sort</code> event</p>
</td>
    </tr><tr>
    <td>[options.descending]</td><td>boolean</td><td><code>false</code></td><td><p>whether to sort in descending order if the comparator is
                                       an attribute name</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="ModelArray__reverse"></a>

### modelArray.reverse([options]) ⇒ this
Reverses the order of the models in the array.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing the <code>sort</code> event</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.reverse();
// reverses the order of models in the array emitting the `sort` event
```
<a id="ModelArray__splice"></a>

### modelArray.splice(start, [deleteCount], [items], [options]) ⇒ Array
Changes the array in place by removing and/or replacing its models
the same way as Array#splice.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>start</td><td>number</td><td></td><td><p>index at which to start changing the array</p>
</td>
    </tr><tr>
    <td>[deleteCount]</td><td>number</td><td></td><td><p>the number of old array elements to remove,
                               defaults to the length of the array</p>
</td>
    </tr><tr>
    <td>[items]</td><td><a href="#Model">Model</a> | Object | Array</td><td></td><td><p>the models to add to the array,
                                       beginning at the start index</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
const modelArray = new ModelArray([model1, model2, model3]);
const result = modelArray.splice(0, 1);
// result is `[model1]`
// modelArray is `[model2, model3]`
```
<a id="ModelArray__get"></a>

### modelArray.get(id) ⇒ [Model](#Model) \| undefined
Gets a model from the array by its id.

**Kind**: instance method of [ModelArray](#ModelArray)  
**Returns**: [Model](#Model) \| undefined - a model or `undefined` if no model is found  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>id</td><td>string</td><td><p>the model&#39;s id</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.get('M123');
// returns a model with id `M123` if it's present in the array
```
<a id="ModelArray__where"></a>

### modelArray.where(attributes, [first]) ⇒ [Array.&lt;Model&gt;](#Model)
Returns models with matching attributes.

**Kind**: instance method of [ModelArray](#ModelArray)  
**Returns**: [Array.&lt;Model&gt;](#Model) - an array of matching models  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>attributes</td><td>Object</td><td></td><td><p>a hash of attributes to match models against</p>
</td>
    </tr><tr>
    <td>[first]</td><td>boolean</td><td><code>false</code></td><td><p>whether to return the first matching model</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.where({ day: 'monday', author: 'Joe'});
// returns all models whose `day` and `author` attributes values equal
// `monday` and `Joe`, respectively

modelArray.where({ day: 'monday' }, true);
// returns the first matching model
```
<a id="ModelArray__read"></a>

### modelArray.read([options]) ⇒ Promise
Updates the array with its stored version.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.success]</td><td>function</td><td></td><td><p>the success callback</p>
</td>
    </tr><tr>
    <td>[options.error]</td><td>function</td><td></td><td><p>the error callback</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing events</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.read()
 .then((response) => console.log(response))
 .catch((error) => console.log(error));
// updates the array with the stored version and logs the response if successful,
// otherwise logs the error
```
<a id="ModelArray__toJSON"></a>

### modelArray.toJSON() ⇒ Array
Creates a copy of the array's models for JSON stringification.

**Kind**: instance method of [ModelArray](#ModelArray)  
**Returns**: Array - an array of stringified models  
<a id="ModelArray__sync"></a>

### modelArray.sync(method, options) ⇒ Promise
The general method to synchronize the array.
Proxies to the `sync` method of the storage if it's specified.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>method</td><td>string</td><td><p>the internal method name.</p>
</td>
    </tr><tr>
    <td>options</td><td>Object</td><td></td>
    </tr>  </tbody>
</table>

<a id="ModelArray__dispose"></a>

### modelArray.dispose([options]) ⇒ this
Prepares the array to be disposed.

**Kind**: instance method of [ModelArray](#ModelArray)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing <code>dispose</code> event</p>
</td>
    </tr><tr>
    <td>[options.save]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing removed models</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
modelArray.dispose();
// disposes the array disposing all its models and emitting the `dispose` event

modelArray.dispose({ save: true });
// disposes the array without disposing its models
```
<a id="ModelArray__on"></a>

### modelArray.on(obj, name, callback) ⇒ this
**Mixes**: [on](#Listener.on)  
<a id="ModelArray__off"></a>

### modelArray.off([obj], [name], [callback]) ⇒ this
**Mixes**: [off](#Listener.off)  
<a id="ModelArray__emit"></a>

### modelArray.emit(name, [data], [emitter]) ⇒ this
**Mixes**: [emit](#Listener.emit)  
<a id="ModelArray__free"></a>

### modelArray.free() ⇒ this
**Mixes**: [free](#Listener.free)  
<a id="Model"></a>

## Model
The Model in MVC.
It manages data and business logic. Models handle synchronization with a persistence layer
through storage controllers and notify subscribers through events when their data is changed.

**Kind**: global class  
**Mixes**: [Listener](#Listener)  

* [Model](#Model)
    * [new Model([attributes], [options])](#new_Model_new)
    * _instance_
        * [.id](#Model__id) : \*
        * [.set(attributes, [options])](#Model__set) ⇒ this \| boolean
        * [.unset(keys, [options])](#Model__unset) ⇒ this \| boolean
        * [.validate()](#Model__validate) ⇒ \*
        * [.clear([options])](#Model__clear) ⇒ this
        * [.get(attribute)](#Model__get) ⇒ \*
        * [.has(attribute)](#Model__has) ⇒ boolean
        * [.changes()](#Model__changes) ⇒ Object \| boolean
        * [.toJSON()](#Model__toJSON) ⇒ Object
        * [.read([options])](#Model__read) ⇒ Promise
        * [.write([options])](#Model__write) ⇒ Promise
        * [.erase([options])](#Model__erase) ⇒ Promise
        * [.sync(method, options)](#Model__sync) ⇒ Promise
        * [.dispose([options])](#Model__dispose) ⇒ this
        * [.on(obj, name, callback)](#Model__on) ⇒ this
        * [.off([obj], [name], [callback])](#Model__off) ⇒ this
        * [.emit(name, [data], [emitter])](#Model__emit) ⇒ this
        * [.free()](#Model__free) ⇒ this
    * _static_
        * [.idAttribute](#Model_idAttribute) : string

<a id="new_Model_new"></a>

### new Model([attributes], [options])
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[attributes]</td><td>Object</td><td></td><td><p>the attributes to be set on a newly created model</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.collection]</td><td>Object</td><td></td><td><p>the collection to which the model should belong</p>
</td>
    </tr><tr>
    <td>[options.storage]</td><td>Object</td><td></td><td><p>the storage engine for the model</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting <code>change</code> events</p>
</td>
    </tr><tr>
    <td>[options.valid]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid validating the attributes</p>
</td>
    </tr><tr>
    <td>[options.nested]</td><td>boolean</td><td><code>false</code></td><td><p>whether to make changes on nested objects</p>
</td>
    </tr>  </tbody>
</table>

<a id="Model__id"></a>

### model.id : \*
The model's permanent `id`.

**Kind**: instance property of [Model](#Model)  
<a id="Model__set"></a>

### model.set(attributes, [options]) ⇒ this \| boolean
The general method to modify the model's data.

**Kind**: instance method of [Model](#Model)  
**Returns**: this \| boolean - either the model if successful or `false` if validation fails  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>attributes</td><td>Object</td><td></td><td><p>the hash of attributes to set on the model</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.unset]</td><td>boolean</td><td><code>false</code></td><td><p>whether to remove specified <code>attributes</code> from the model</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting <code>change</code> events</p>
</td>
    </tr><tr>
    <td>[options.valid]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid validating attributes</p>
</td>
    </tr><tr>
    <td>[options.nested]</td><td>boolean</td><td><code>false</code></td><td><p>whether to make changes on nested objects</p>
</td>
    </tr><tr>
    <td>[options.past]</td><td>boolean</td><td><code>false</code></td><td><p>whether to keep the previous values of the attributes
                                 in <code>this.previous</code> after the method finishes</p>
</td>
    </tr><tr>
    <td>[options.circular]</td><td>boolean</td><td><code>false</code></td><td><p>whether the provided attributes have circular references</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.set({ foo: 'bar' });
// sets attribute `foo` on the model to 'bar'

model.set({ foo: 'bar' }, { valid: true});
// skips validation for attributes

model.set({ value: 2, 'nestedObj.nestedValue': 1 }, { nested: true });
// sets `value` to 2 and `nestedValue` of the `nestedObj` to `1`

model.set({ foo: 1 }, { past: true });
// saves the previous value of the `foo` attribute in `model.previous`
```
<a id="Model__unset"></a>

### model.unset(keys, [options]) ⇒ this \| boolean
Removes specified attributes from the model.

**Kind**: instance method of [Model](#Model)  
**Returns**: this \| boolean - either the model if successful or `false` if validation fails  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>keys</td><td>Array | string</td><td></td><td><p>the attribute name(s) to be removed from the model</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting <code>change</code> events</p>
</td>
    </tr><tr>
    <td>[options.valid]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid validating attributes</p>
</td>
    </tr><tr>
    <td>[options.nested]</td><td>boolean</td><td><code>false</code></td><td><p>whether to make changes on nested objects</p>
</td>
    </tr><tr>
    <td>[options.past]</td><td>boolean</td><td><code>false</code></td><td><p>whether to keep the previous values of the attributes
                                 in <code>this.previous</code> after the method finishes</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.unset('foo');
// the `foo` attribute is removed from the model

model.unset(['foo', 'bar']);
// both 'foo' and 'bar' attributes are removed
```
<a id="Model__validate"></a>

### model.validate() ⇒ \*
Override to include all necessary data validation and coercion logic specific to the model.
The convention is for `validate` to return `false` if data is valid.

**Kind**: instance method of [Model](#Model)  
<a id="Model__clear"></a>

### model.clear([options]) ⇒ this
Clears all attributes on the model firing a single `clear` event.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing <code>clear</code> event</p>
</td>
    </tr><tr>
    <td>[options.past]</td><td>boolean</td><td><code>false</code></td><td><p>whether to save the current model data in <code>this.previous</code></p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.clear();
// all attributes are removed from the model
```
<a id="Model__get"></a>

### model.get(attribute) ⇒ \*
Gets a value of a data attribute. If not present, looks it up among the model's getters.
For simplicity's sake, any property that isn't a function is considered a getter.

**Kind**: instance method of [Model](#Model)  
**Returns**: \* - the value of the data attribute or getter  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>attribute</td><td>string</td><td><p>an attribute or getter name</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.get('foo');
// returns the value of the `foo` attribute
```
<a id="Model__has"></a>

### model.has(attribute) ⇒ boolean
Checks whether the model has the attribute.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>attribute</td><td>string</td><td><p>the attribute name to look for</p>
</td>
    </tr>  </tbody>
</table>

<a id="Model__changes"></a>

### model.changes() ⇒ Object \| boolean
Returns a hash of changed attributes since the last `set` operation or `false`
if no changes are found.

**Kind**: instance method of [Model](#Model)  
<a id="Model__toJSON"></a>

### model.toJSON() ⇒ Object
Returns a copy of the model's attributes for JSON stringification.

**Kind**: instance method of [Model](#Model)  
<a id="Model__read"></a>

### model.read([options]) ⇒ Promise
Resets the model's state from the storage.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting events</p>
</td>
    </tr><tr>
    <td>[options.valid]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid validating attributes</p>
</td>
    </tr><tr>
    <td>[options.past]</td><td>boolean</td><td><code>false</code></td><td><p>whether to keep the previous values of the attributes
                                in <code>this.previous</code> after the method finishes</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.read().then((response) => console.log(response)).catch((error) => console.log(error));
// updates the model with the stored version and logs the response if successful,
// otherwise logs the error

model.read({ valid: true });
// skips validation of the retrieved attributes

model.read({ past: true });
// saves the previous values of changed attributes in `model.previous`
```
<a id="Model__write"></a>

### model.write([options]) ⇒ Promise
Saves the model into the storage. If the storage responds with an object, updates the model
with the response object.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting events</p>
</td>
    </tr><tr>
    <td>[options.valid]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid validating attributes if model is updated</p>
</td>
    </tr><tr>
    <td>[options.past]</td><td>boolean</td><td><code>false</code></td><td><p>whether to keep the previous values of the attributes
                                 in <code>this.previous</code> if model is updated</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.write().then((response) => console.log(response)).catch((error) => console.log(error));
// writes the model into the storage and logs the response if successful,
// otherwise logs the error

model.write({ valid: true });
// skips validation of the retrieved attributes if the storage any

model.write({ past: true });
// saves the previous values of changed attributes in `model.previous`
```
<a id="Model__erase"></a>

### model.erase([options]) ⇒ Promise
Removes the model from the storage.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting events</p>
</td>
    </tr><tr>
    <td>[options.keep]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid disposing the model after erasing</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.erase().then((response) => console.log(response)).catch((error) => console.log(error));
// removes the stored version of the model and logs the response if successful,
// otherwise logs the error
```
<a id="Model__sync"></a>

### model.sync(method, options) ⇒ Promise
The general method to synchronize the model.
Proxies to the `sync` method of the storage if it is specified.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>method</td><td>string</td><td><p>the internal method name</p>
</td>
    </tr><tr>
    <td>options</td><td>Object</td><td><p>the options to be sent to the <code>sync</code> method of the storage</p>
</td>
    </tr>  </tbody>
</table>

<a id="Model__dispose"></a>

### model.dispose([options]) ⇒ this
Prepares the model to be disposed by removing all listeners
set up by the model or on the model.

**Kind**: instance method of [Model](#Model)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing the <code>dispose</code> event</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
model.dispose();
// prepares the model for disposal
```
<a id="Model__on"></a>

### model.on(obj, name, callback) ⇒ this
**Mixes**: [on](#Listener.on)  
<a id="Model__off"></a>

### model.off([obj], [name], [callback]) ⇒ this
**Mixes**: [off](#Listener.off)  
<a id="Model__emit"></a>

### model.emit(name, [data], [emitter]) ⇒ this
**Mixes**: [emit](#Listener.emit)  
<a id="Model__free"></a>

### model.free() ⇒ this
**Mixes**: [free](#Listener.free)  
<a id="Model_idAttribute"></a>

### Model.idAttribute : string
The id property name for the models of the class.

**Kind**: static property of [Model](#Model)  
<a id="RemoteStorage"></a>

## RemoteStorage
Facilitates interaction with a REST server through the Fetch API.

**Kind**: global class  
**Mixes**: [Listener](#Listener)  

* [RemoteStorage](#RemoteStorage)
    * [new RemoteStorage([options])](#new_RemoteStorage_new)
    * _instance_
        * [.sync(method, model, options)](#RemoteStorage__sync) ⇒ Promise
        * [.dispose([options])](#RemoteStorage__dispose) ⇒ this
        * [.on(obj, name, callback)](#RemoteStorage__on) ⇒ this
        * [.off([obj], [name], [callback])](#RemoteStorage__off) ⇒ this
        * [.emit(name, [data], [emitter])](#RemoteStorage__emit) ⇒ this
        * [.free()](#RemoteStorage__free) ⇒ this
    * _static_
        * [.methods](#RemoteStorage_methods)
        * [.isStored(model)](#RemoteStorage_isStored) ⇒ boolean

<a id="new_RemoteStorage_new"></a>

### new RemoteStorage([options])
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td>
    </tr><tr>
    <td>[options.url]</td><td>string</td><td><p>the base URL for requests, by default uses the window&#39;s origin</p>
</td>
    </tr><tr>
    <td>[options.init]</td><td>Object</td><td><p>an options object for custom settings
                               to use as the <code>init</code> parameter in calls to the global fetch()</p>
</td>
    </tr>  </tbody>
</table>

<a id="RemoteStorage__sync"></a>

### remoteStorage.sync(method, model, options) ⇒ Promise
The general method for synchronization.

**Kind**: instance method of [RemoteStorage](#RemoteStorage)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>method</td><td>string</td><td></td><td><p>a method name to execute.
                  Internal method names are mapped to HTTP methods in <code>RemoteStorage.methods</code>.</p>
</td>
    </tr><tr>
    <td>model</td><td><a href="#Model">Model</a> | <a href="#new_Collection_new">Collection</a> | <a href="#ModelArray">ModelArray</a></td><td></td><td><p>a model or a collection to be synchronized</p>
</td>
    </tr><tr>
    <td>options</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing any events</p>
</td>
    </tr><tr>
    <td>[options.patch]</td><td>Boolean</td><td></td><td><p>whether to send only changed attributes (if present)
                                 using the <code>PATCH</code> method</p>
</td>
    </tr><tr>
    <td>[options.url]</td><td>string</td><td></td><td><p>a specific url for the request,
                              in case it&#39;s different from the default url of the storage</p>
</td>
    </tr><tr>
    <td>[options.init]</td><td>Object</td><td></td><td><p>an options object for custom settings
                               to use as the <code>init</code> parameter in calls to the global fetch()</p>
</td>
    </tr>  </tbody>
</table>

<a id="RemoteStorage__dispose"></a>

### remoteStorage.dispose([options]) ⇒ this
Prepares the storage controller to be disposed.

**Kind**: instance method of [RemoteStorage](#RemoteStorage)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid emitting the <code>dispose</code> event.</p>
</td>
    </tr>  </tbody>
</table>

<a id="RemoteStorage__on"></a>

### remoteStorage.on(obj, name, callback) ⇒ this
**Mixes**: [on](#Listener.on)  
<a id="RemoteStorage__off"></a>

### remoteStorage.off([obj], [name], [callback]) ⇒ this
**Mixes**: [off](#Listener.off)  
<a id="RemoteStorage__emit"></a>

### remoteStorage.emit(name, [data], [emitter]) ⇒ this
**Mixes**: [emit](#Listener.emit)  
<a id="RemoteStorage__free"></a>

### remoteStorage.free() ⇒ this
**Mixes**: [free](#Listener.free)  
<a id="RemoteStorage_methods"></a>

### RemoteStorage.methods
The map translating internal method names to their respective HTTP methods.

**Kind**: static property of [RemoteStorage](#RemoteStorage)  
<a id="RemoteStorage_isStored"></a>

### RemoteStorage.isStored(model) ⇒ boolean
Checks whether the model has been already persisted on the server.

**Kind**: static method of [RemoteStorage](#RemoteStorage)  
**Returns**: boolean - True if the model is already stored on the server  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>model</td><td><a href="#Model">Model</a></td><td><p>the model to be checked</p>
</td>
    </tr>  </tbody>
</table>

<a id="Router"></a>

## Router
Handles client-side routing and navigation utilizing the History API.

**Kind**: global class  
**Mixes**: [Listener](#Listener)  

* [Router](#Router)
    * [new Router([options])](#new_Router_new)
    * [.addRoute(name, route)](#Router__addRoute) ⇒ this
    * [.removeRoute(name)](#Router__removeRoute) ⇒ this
    * [.start([options])](#Router__start) ⇒ this
    * [.stop()](#Router__stop) ⇒ this
    * [.navigate(fragment, [options])](#Router__navigate) ⇒ boolean
    * [.dispose([options])](#Router__dispose) ⇒ this
    * [.on(obj, name, callback)](#Router__on) ⇒ this
    * [.off([obj], [name], [callback])](#Router__off) ⇒ this
    * [.emit(name, [data], [emitter])](#Router__emit) ⇒ this
    * [.free()](#Router__free) ⇒ this

<a id="new_Router_new"></a>

### new Router([options])
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td>
    </tr><tr>
    <td>[options.routes]</td><td>Object</td><td><p>a hash of routes</p>
</td>
    </tr><tr>
    <td>[options.root]</td><td>string</td><td></td>
    </tr>  </tbody>
</table>

**Example**  
```js
new Router({ routes: {
                       'home':'/',
                       'profile': 'users/:name',
                       'post': 'posts/:date/:slug'
                     },
          });
```
<a id="Router__addRoute"></a>

### router.addRoute(name, route) ⇒ this
Adds a route to the collection of routes.

**Kind**: instance method of [Router](#Router)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td>string</td><td><p>the route name</p>
</td>
    </tr><tr>
    <td>route</td><td>string</td><td><p>the path string</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
router.addRoute('home', '/');
// adds a route named home with the path '/' to the routes list so that every time user
// navigates to the root URL the router emit `route:home` event

router.addRoute('profile', '/users/:name');
// if user visits `/users/JohnDoe` router will fire `route:profile`
// with `event.params.name` set to `JohnDoe`
```
<a id="Router__removeRoute"></a>

### router.removeRoute(name) ⇒ this
Removes a route from the collection of routes.

**Kind**: instance method of [Router](#Router)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td>string</td><td><p>the route name to be removed</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
router.removeRoute('home');
// if present, route named 'home' will be removed from the routes list
```
<a id="Router__start"></a>

### router.start([options]) ⇒ this
Starts the router enabling it to handle URL changes.

**Kind**: instance method of [Router](#Router)  
**Throws**:

- Error if the support for History API could not be found

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid attempting to load the current URL fragment</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
router.start();
// starts to listen to URL changes checking them against the routes list, upon start checks
// the current URL for routes

router.start({ silent: true });
//starts the router without checking the current URL
```
<a id="Router__stop"></a>

### router.stop() ⇒ this
Stops the router preventing it from handling URL changes.

**Kind**: instance method of [Router](#Router)  
<a id="Router__navigate"></a>

### router.navigate(fragment, [options]) ⇒ boolean
Saves a fragment into the browser history.

**Kind**: instance method of [Router](#Router)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>fragment</td><td>string</td><td></td><td><p>a properly URL-encoded fragment to place into the history</p>
</td>
    </tr><tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.replace]</td><td>boolean</td><td><code>false</code></td><td><p>whether to change the current item in the history
                                   instead of adding a new one</p>
</td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid checking the fragment for routes</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
router.navigate('/users');
// sets the current URL to '/users', pushes it into history, and checks the new URL for routes

router.navigate('/users', { replace: true });
// replaces the current URL with '/users' and checks it for routes

routes.navigate('/users', { silent: true });
// does not check the new URL for routes
```
<a id="Router__dispose"></a>

### router.dispose([options]) ⇒ this
Prepares the router to be disposed.

**Kind**: instance method of [Router](#Router)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td>Object</td><td></td><td></td>
    </tr><tr>
    <td>[options.silent]</td><td>boolean</td><td><code>false</code></td><td><p>whether to avoid firing <code>dispose</code> event</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
router.dispose();
// stops the router, removes the routes and event listeners
```
<a id="Router__on"></a>

### router.on(obj, name, callback) ⇒ this
**Mixes**: [on](#Listener.on)  
<a id="Router__off"></a>

### router.off([obj], [name], [callback]) ⇒ this
**Mixes**: [off](#Listener.off)  
<a id="Router__emit"></a>

### router.emit(name, [data], [emitter]) ⇒ this
**Mixes**: [emit](#Listener.emit)  
<a id="Router__free"></a>

### router.free() ⇒ this
**Mixes**: [free](#Listener.free)  
<a id="Listener"></a>

## Listener
Provides methods for event handling.

**Kind**: global mixin  
**Example**  
```js
const emitter = Object.assign({}, Listener);
const listener = Object.assign({}, Listener);
listener.on(emitter, 'someEvent', listener.doSomething);
emitter.emit('someEvent');
// listener.doSomething is invoked.
```

* [Listener](#Listener)
    * [.on(obj, name, callback)](#Listener_on) ⇒ this
    * [.off([obj], [name], [callback])](#Listener_off) ⇒ this
    * [.emit(name, [data], [emitter])](#Listener_emit) ⇒ this
    * [.free()](#Listener_free) ⇒ this

<a id="Listener_on"></a>

### Listener.on(obj, name, callback) ⇒ this
Adds an event listener for the specified event(s).

The `callback` will be called with `this` being the listener
whenever `obj` emits the `name` event.

**Kind**: static method of [Listener](#Listener)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>obj</td><td>Object</td><td><p>the object to listen to</p>
</td>
    </tr><tr>
    <td>name</td><td>string</td><td><p>the event name or names separated by whitespace</p>
</td>
    </tr><tr>
    <td>callback</td><td>function</td><td><p>the function to be called when the event is emitted</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
Controller.on(Model, 'change', Controller.render);
// `Controller.render` will be invoked with `this` set to the Controller
// when Model emits a `change` event.

Collection.on(Model, 'add remove', Collection.count);
// `Collection.count` will be invoked every time the Model emits an `add` or a `remove` event.
```
<a id="Listener_off"></a>

### Listener.off([obj], [name], [callback]) ⇒ this
Removes event listeners set up by the host object on other objects.

**Kind**: static method of [Listener](#Listener)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[obj]</td><td>Object</td><td><p>the object to stop listening to</p>
</td>
    </tr><tr>
    <td>[name]</td><td>string</td><td><p>the event name or names</p>
</td>
    </tr><tr>
    <td>[callback]</td><td>function</td><td><p>the callback function to be removed</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="Listener_emit"></a>

### Listener.emit(name, [data], [emitter]) ⇒ this
Emits `name` and `all` events invoking all the callbacks subscribed to the events.

**Kind**: static method of [Listener](#Listener)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td>string</td><td><p>the event name</p>
</td>
    </tr><tr>
    <td>[data]</td><td>Object</td><td><p>the hash of additional parameters that are sent to event listeners</p>
</td>
    </tr><tr>
    <td>[emitter]</td><td>Object</td><td><p>the emitter of the event</p>
</td>
    </tr>  </tbody>
</table>

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
<a id="Listener_free"></a>

### Listener.free() ⇒ this
Removes all callbacks bound by other objects to the host object.

It is used to easily dispose of the object.

**Kind**: static method of [Listener](#Listener)  
**Example**  
```js
Controller.on(Model, 'change', this.render);
Collection.on(Model, 'all', this.update);
Model.free();
// both event listeners are now removed
// equivalent to `Collection.off(Model), Controller.off(Model)`
```
