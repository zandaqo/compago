## Classes

<dl>
<dt><a href="#Controller">Controller</a> ⇐ <code>LitElement</code></dt>
<dd><p>The Controller in MVC.
It manages its Model and View while handling user interactions. Controller handles user input
through DOM events and updates its Model accordingly. It listens to updates on its Model
to re-render its View.</p>
</dd>
<dt><a href="#ModelArray">ModelArray</a> ⇐ <code>Array</code></dt>
<dd><p>Manages an ordered set of models providing methods to create, sort, and remove of the models.</p>
</dd>
<dt><a href="#Model">Model</a> ⇐ <code>EventTarget</code></dt>
<dd><p>The Model in MVC.
It manages data and business logic. Models handle synchronization with a persistence layer
through storage controllers and notify subscribers through events when their data is changed.</p>
</dd>
<dt><a href="#RemoteStorage">RemoteStorage</a> ⇐ <code>EventTarget</code></dt>
<dd><p>Facilitates interaction with a REST server through the Fetch API.</p>
</dd>
<dt><a href="#Translator">Translator</a> ⇐ <code>EventTarget</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ControllerBond">ControllerBond</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Routes">Routes</a> : <code>Object.&lt;string, RegExp&gt;</code></dt>
<dd></dd>
<dt><a href="#Translations">Translations</a> : <code>Object.&lt;string, Object.&lt;string, (Object|string)&gt;&gt;</code></dt>
<dd></dd>
<dt><a href="#TranslatorOptions">TranslatorOptions</a></dt>
<dd></dd>
</dl>

<a name="Controller"></a>

## Controller ⇐ <code>LitElement</code>
The Controller in MVC.
It manages its Model and View while handling user interactions. Controller handles user input
through DOM events and updates its Model accordingly. It listens to updates on its Model
to re-render its View.

**Kind**: global class  
**Extends**: <code>LitElement</code>  

* [Controller](#Controller) ⇐ <code>LitElement</code>
    * _instance_
        * [.model](#Controller+model) : [<code>Model</code>](#Model) \| [<code>ModelArray</code>](#ModelArray)
        * [.routes](#Controller+routes) : [<code>Routes</code>](#Routes)
        * [.connectedCallback()](#Controller+connectedCallback) ⇒ <code>void</code>
        * [.disconnectedCallback()](#Controller+disconnectedCallback) ⇒ <code>void</code>
        * [.onModelChange()](#Controller+onModelChange) ⇒ <code>void</code>
        * [.route(name, params, query, hash)](#Controller+route) ⇒ <code>void</code>
        * [.onLanguageChange()](#Controller+onLanguageChange) ⇒ <code>void</code>
    * _static_
        * [.translator](#Controller.translator) : [<code>Translator</code>](#Translator)
        * [.translations](#Controller.translations) : [<code>Translations</code>](#Translations)
        * [.bond](#Controller.bond) ⇒ <code>void</code>
        * [.navigate](#Controller.navigate) ⇒ <code>void</code>
        * [.ts](#Controller.ts) ⇒ <code>void</code>
        * [.translate(key, [interpolation])](#Controller.translate) ⇒ <code>string</code>

<a name="Controller+model"></a>

### controller.model : [<code>Model</code>](#Model) \| [<code>ModelArray</code>](#ModelArray)
**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+routes"></a>

### controller.routes : [<code>Routes</code>](#Routes)
**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+connectedCallback"></a>

### controller.connectedCallback() ⇒ <code>void</code>
Invoked once the controller is attached to the DOM.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+disconnectedCallback"></a>

### controller.disconnectedCallback() ⇒ <code>void</code>
Invoked once the controller is detached from the DOM.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+onModelChange"></a>

### controller.onModelChange() ⇒ <code>void</code>
Handles `change` events of the controller's model.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+route"></a>

### controller.route(name, params, query, hash) ⇒ <code>void</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 
| params | <code>Object</code> | 
| query | <code>string</code> | 
| hash | <code>string</code> | 

<a name="Controller+onLanguageChange"></a>

### controller.onLanguageChange() ⇒ <code>void</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller.translator"></a>

### Controller.translator : [<code>Translator</code>](#Translator)
**Kind**: static property of [<code>Controller</code>](#Controller)  
<a name="Controller.translations"></a>

### Controller.translations : [<code>Translations</code>](#Translations)
**Kind**: static property of [<code>Controller</code>](#Controller)  
<a name="Controller.bond"></a>

### Controller.bond ⇒ <code>void</code>
Handles one-way binding to model or controller properties.

**Kind**: static property of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| binding | [<code>ControllerBond</code>](#ControllerBond) | 

<a name="Controller.navigate"></a>

### Controller.navigate ⇒ <code>void</code>
Saves a given URL (or the URL from href property of the element) into the browser history.

**Kind**: static property of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| [href] | <code>string</code> | 

<a name="Controller.ts"></a>

### Controller.ts ⇒ <code>void</code>
**Kind**: static property of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| ctor | [<code>Class.&lt;Controller&gt;</code>](#Controller) | 
| key | <code>string</code> | 
| [interpolation] | <code>\*</code> | 

<a name="Controller.translate"></a>

### Controller.translate(key, [interpolation]) ⇒ <code>string</code>
**Kind**: static method of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| [interpolation] | <code>\*</code> | 

<a name="ModelArray"></a>

## ModelArray ⇐ <code>Array</code>
Manages an ordered set of models providing methods to create, sort, and remove of the models.

**Kind**: global class  
**Extends**: <code>Array</code>, <code>EventTarget</code>  

* [ModelArray](#ModelArray) ⇐ <code>Array</code>
    * [new ModelArray([models], [options])](#new_ModelArray_new)
    * [.set([models], [options])](#ModelArray+set) ⇒ <code>this</code>
    * [.unset(models)](#ModelArray+unset) ⇒ <code>this</code>
    * [.push(...models)](#ModelArray+push) ⇒ <code>this</code>
    * [.pop()](#ModelArray+pop) ⇒ [<code>Model</code>](#Model)
    * [.unshift(...models)](#ModelArray+unshift) ⇒ <code>this</code>
    * [.shift()](#ModelArray+shift) ⇒ [<code>Model</code>](#Model)
    * [.sort([options])](#ModelArray+sort) ⇒ <code>this</code>
    * [.reverse()](#ModelArray+reverse) ⇒ <code>this</code>
    * [.splice(start, [deleteCount], [...items])](#ModelArray+splice) ⇒ <code>Array</code>
    * [.get(id)](#ModelArray+get) ⇒ [<code>Model</code>](#Model) \| <code>undefined</code>
    * [.where([attributes], [first])](#ModelArray+where) ⇒ [<code>Array.&lt;Model&gt;</code>](#Model)
    * [.read()](#ModelArray+read) ⇒ <code>Promise</code>
    * [.toJSON()](#ModelArray+toJSON) ⇒ <code>Array</code>
    * [.sync(method)](#ModelArray+sync) ⇒ <code>Promise</code>

<a name="new_ModelArray_new"></a>

### new ModelArray([models], [options])

| Param | Type | Description |
| --- | --- | --- |
| [models] | <code>Array.&lt;(Model\|object)&gt;</code> | models to add to the array |
| [options] | <code>Object</code> |  |
| [options.storage] | <code>Object</code> | the storage controller for the array |
| [options.model] | [<code>Model</code>](#Model) | the class of models in the array |
| [options.comparator] | <code>function</code> \| <code>string</code> | a function or an attribute name                                                   that will be used to sort the array |

<a name="ModelArray+set"></a>

### modelArray.set([models], [options]) ⇒ <code>this</code>
The general method to modify the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [models] | <code>Array</code> \| <code>Object</code> | <code>[]</code> | a model, a list of models or objects to be added                                to the array or updated if already present |
| [options] | <code>Object</code> |  |  |
| [options.at] | <code>number</code> |  | the position at which the model(s) should be placed |
| [options.keep] | <code>boolean</code> |  | whether to avoid removing the models not present                                          in the supplied list |
| [options.skip] | <code>boolean</code> |  | whether to avoid updating existing models |
| [options.unsorted] | <code>boolean</code> |  | whether to avoid sorting the array |

**Example**  
```js
let modelArray = new ModelArray([model0]);
modelArray.set([model1, model2]);
// resets the array models to `[model1, model2]` emitting `add` events on both models,
// removes the existing `model0` which emits the `remove` event

modelArray.set(model3, { keep: true });
// adds `model3` to the list of array models without removing the existing models

modelArray.set(model4, { keep: true, at: 0 });
// adds `model4` at the beginning of the array

modelArray.set([model1, model4], { keep: true, unsorted: true });
// avoids sorting the resulting list of models
```
<a name="ModelArray+unset"></a>

### modelArray.unset(models) ⇒ <code>this</code>
Removes a model or a list of models from the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| models | [<code>Model</code>](#Model) \| [<code>Array.&lt;Model&gt;</code>](#Model) | the model(s) to remove from the array |

**Example**  
```js
let modelArray = new ModelArray([model1, model2]);
modelArray.unset(model1);
// removes `model1` from the array emitting `remove` event
```
<a name="ModelArray+push"></a>

### modelArray.push(...models) ⇒ <code>this</code>
Adds a model(s) to the end of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| ...models | <code>\*</code> | the model(s) or objects to be added to the array. |

**Example**  
```js
modelArray.push(model);
// adds model to the end of the array
```
<a name="ModelArray+pop"></a>

### modelArray.pop() ⇒ [<code>Model</code>](#Model)
Removes a model from the end of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Model</code>](#Model) - the removed model  
**Example**  
```js
modelArray.pop();
// removes the last model from the array and returns it
```
<a name="ModelArray+unshift"></a>

### modelArray.unshift(...models) ⇒ <code>this</code>
Adds a model(s) to the beginning of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| ...models | <code>\*</code> | the model(s) or objects to be added to the array. |

**Example**  
```js
modelArray.unshift(model);
// adds model to the beginning of the array
```
<a name="ModelArray+shift"></a>

### modelArray.shift() ⇒ [<code>Model</code>](#Model)
Removes a model from the beginning of the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Model</code>](#Model) - the removed model  
**Example**  
```js
modelArray.shift();
// removes the first model from the array and returns it
```
<a name="ModelArray+sort"></a>

### modelArray.sort([options]) ⇒ <code>this</code>
Sorts the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> \| <code>function</code> |  |
| [options.comparator] | <code>function</code> \| <code>string</code> | a comparator function or an attribute name                                                 for sorting |
| [options.descending] | <code>boolean</code> | whether to sort in descending order if the comparator is                                        an attribute name |

**Example**  
```js
modelArray.sort();
// attemps to sort the array using its predefined comparator from `this.comparator`
// emitting the `sort` event

modelArray.sort((a, b) => (a.order > b.order ? 1 : -1));
// sorts the array using the provided comparator emitting `sort` event

modelArray.sort({ comparator: '_id' });
// sorts models according to their `_id` field in ascending order

modelArray.sort({ comparator: '_id', descending: true });
// sorts according to `_id` field in descending order
```
<a name="ModelArray+reverse"></a>

### modelArray.reverse() ⇒ <code>this</code>
Reverses the order of the models in the array.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Example**  
```js
modelArray.reverse();
// reverses the order of models in the array emitting the `sort` event
```
<a name="ModelArray+splice"></a>

### modelArray.splice(start, [deleteCount], [...items]) ⇒ <code>Array</code>
Changes the array in place by removing and/or replacing its models
the same way as Array#splice.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| start | <code>number</code> | index at which to start changing the array |
| [deleteCount] | <code>number</code> | the number of old array elements to remove,                                defaults to the length of the array |
| [...items] | <code>\*</code> | the models to add to the array,                                        beginning at the start index |

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

### modelArray.where([attributes], [first]) ⇒ [<code>Array.&lt;Model&gt;</code>](#Model)
Returns models with matching attributes.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
**Returns**: [<code>Array.&lt;Model&gt;</code>](#Model) - an array of matching models  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [attributes] | <code>Object</code> | <code>{}</code> | a hash of attributes to match models against |
| [first] | <code>boolean</code> |  | whether to return the first matching model |

**Example**  
```js
modelArray.where({ day: 'monday', author: 'Joe'});
// returns all models whose `day` and `author` attributes values equal
// `monday` and `Joe`, respectively

modelArray.where({ day: 'monday' }, true);
// returns the first matching model
```
<a name="ModelArray+read"></a>

### modelArray.read() ⇒ <code>Promise</code>
Updates the array with its stored version.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  
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

### modelArray.sync(method) ⇒ <code>Promise</code>
The general method to synchronize the array.
Proxies to the `sync` method of the storage if it's specified.

**Kind**: instance method of [<code>ModelArray</code>](#ModelArray)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | the internal method name. |

<a name="Model"></a>

## Model ⇐ <code>EventTarget</code>
The Model in MVC.
It manages data and business logic. Models handle synchronization with a persistence layer
through storage controllers and notify subscribers through events when their data is changed.

**Kind**: global class  
**Extends**: <code>EventTarget</code>  

* [Model](#Model) ⇐ <code>EventTarget</code>
    * [new Model([attributes], [options])](#new_Model_new)
    * _instance_
        * [.id](#Model+id) : <code>\*</code>
        * [.set([attributes])](#Model+set) ⇒ <code>this</code>
        * [.assign([attributes])](#Model+assign) ⇒ <code>this</code>
        * [.merge(source, [target])](#Model+merge) ⇒ <code>Object</code>
        * [.toJSON()](#Model+toJSON) ⇒ <code>Object</code>
        * [.read([options])](#Model+read) ⇒ <code>Promise</code>
        * [.write([options])](#Model+write) ⇒ <code>Promise</code>
        * [.erase([options])](#Model+erase) ⇒ <code>Promise</code>
        * [.sync(method, options)](#Model+sync) ⇒ <code>Promise</code>
    * _static_
        * [.storage](#Model.storage) : [<code>RemoteStorage</code>](#RemoteStorage)
        * [.idAttribute](#Model.idAttribute) : <code>string</code>
        * [.definePrivate(model, properties)](#Model.definePrivate) ⇒ <code>void</code>

<a name="new_Model_new"></a>

### new Model([attributes], [options])

| Param | Type | Description |
| --- | --- | --- |
| [attributes] | <code>Object</code> | the attributes to be set on a newly created model |
| [options] | <code>Object</code> |  |
| [options.collection] | <code>Object</code> | the collection to which the model should belong |

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

### model.assign([attributes]) ⇒ <code>this</code>
Assigns given attributes to the model.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| [attributes] | <code>Object</code> | the attributes to be assigned to the model |

<a name="Model+merge"></a>

### model.merge(source, [target]) ⇒ <code>Object</code>
Merges two objects. If no target object provided, merges given source object to the model's
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
| [options.skip] | <code>boolean</code> |  | whether to avoid updating existing attributes                                with the received ones |
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
| [options.skip] | <code>boolean</code> |  | whether to avoid updating existing attributes                                 with the received ones |
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

| Param | Type |
| --- | --- |
| [options] | <code>Object</code> | 

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

<a name="Model.storage"></a>

### Model.storage : [<code>RemoteStorage</code>](#RemoteStorage)
**Kind**: static property of [<code>Model</code>](#Model)  
<a name="Model.idAttribute"></a>

### Model.idAttribute : <code>string</code>
The id property name for the models of the class.

**Kind**: static property of [<code>Model</code>](#Model)  
<a name="Model.definePrivate"></a>

### Model.definePrivate(model, properties) ⇒ <code>void</code>
Given a hash of property names and their initial values,
sets them up as non-enumerable properties of the model.

**Kind**: static method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Object</code> | the model on which properties are to be set |
| properties | <code>Object</code> | a hash of Symbol key names and initial values to be set on the model |

**Example**  
```js
const model = new Model();
Model.definePrivate(model, { _privateKey: 1 });
model._privateKey
//=> 1
Object.keys(model)
//=> []
```
<a name="RemoteStorage"></a>

## RemoteStorage ⇐ <code>EventTarget</code>
Facilitates interaction with a REST server through the Fetch API.

**Kind**: global class  
**Extends**: <code>EventTarget</code>  

* [RemoteStorage](#RemoteStorage) ⇐ <code>EventTarget</code>
    * [new RemoteStorage([options])](#new_RemoteStorage_new)
    * _instance_
        * [.sync(method, model, options)](#RemoteStorage+sync) ⇒ <code>Promise</code>
        * [.serialize(data)](#RemoteStorage+serialize) ⇒ <code>string</code>
        * [.deserialize(response)](#RemoteStorage+deserialize) ⇒ <code>Promise</code> \| <code>void</code>
    * _static_
        * [.methods](#RemoteStorage.methods) : <code>Object.&lt;string, string&gt;</code>
        * [.headers](#RemoteStorage.headers) : <code>Object.&lt;string, string&gt;</code>
        * [.fetch(url, options)](#RemoteStorage.fetch) ⇒ <code>Promise</code>
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

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | a method name to execute.                   Internal method names are mapped to HTTP methods in `RemoteStorage.methods`. |
| model | [<code>Model</code>](#Model) \| [<code>ModelArray</code>](#ModelArray) | a model or a collection to be synchronized |
| options | <code>Object</code> |  |
| [options.patch] | <code>boolean</code> | whether to send only changed attributes (if present)                                  using the `PATCH` method |

<a name="RemoteStorage+serialize"></a>

### remoteStorage.serialize(data) ⇒ <code>string</code>
Serializes data before sending.

**Kind**: instance method of [<code>RemoteStorage</code>](#RemoteStorage)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | the data to be serialized |

<a name="RemoteStorage+deserialize"></a>

### remoteStorage.deserialize(response) ⇒ <code>Promise</code> \| <code>void</code>
Deserializes a received response.

**Kind**: instance method of [<code>RemoteStorage</code>](#RemoteStorage)  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>Response</code> | the received response |

<a name="RemoteStorage.methods"></a>

### RemoteStorage.methods : <code>Object.&lt;string, string&gt;</code>
The map translating internal method names to their respective HTTP methods.

**Kind**: static property of [<code>RemoteStorage</code>](#RemoteStorage)  
<a name="RemoteStorage.headers"></a>

### RemoteStorage.headers : <code>Object.&lt;string, string&gt;</code>
Default headers for all fetch requests.

**Kind**: static property of [<code>RemoteStorage</code>](#RemoteStorage)  
<a name="RemoteStorage.fetch"></a>

### RemoteStorage.fetch(url, options) ⇒ <code>Promise</code>
Wraps global fetch to apply default headers.

**Kind**: static method of [<code>RemoteStorage</code>](#RemoteStorage)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> \| <code>Request</code> | the resource to fetch |
| options | <code>Object</code> | custom settings for the request |

<a name="RemoteStorage.isStored"></a>

### RemoteStorage.isStored(model) ⇒ <code>boolean</code>
Checks whether the model has been already persisted on the server.

**Kind**: static method of [<code>RemoteStorage</code>](#RemoteStorage)  
**Returns**: <code>boolean</code> - True if the model is already stored on the server  

| Param | Type | Description |
| --- | --- | --- |
| model | [<code>Model</code>](#Model) | the model to be checked |

<a name="Translator"></a>

## Translator ⇐ <code>EventTarget</code>
**Kind**: global class  
**Extends**: <code>EventTarget</code>  

* [Translator](#Translator) ⇐ <code>EventTarget</code>
    * [new Translator(options)](#new_Translator_new)
    * _instance_
        * [.setLanguage(language)](#Translator+setLanguage) ⇒ <code>void</code>
        * [.getLanguage(language)](#Translator+getLanguage) ⇒ <code>string</code>
        * [.reportMissing(componentName, key, [rule])](#Translator+reportMissing) ⇒ <code>void</code>
        * [.translate(translations, key, [interpolation], [componentName])](#Translator+translate) ⇒ <code>string</code>
    * _static_
        * [.initialize(options, symbol)](#Translator.initialize) ⇒ [<code>Translator</code>](#Translator)
        * [.interpolate(text, interpolation)](#Translator.interpolate) ⇒ <code>string</code>

<a name="new_Translator_new"></a>

### new Translator(options)

| Param | Type |
| --- | --- |
| options | [<code>TranslatorOptions</code>](#TranslatorOptions) | 

<a name="Translator+setLanguage"></a>

### translator.setLanguage(language) ⇒ <code>void</code>
**Kind**: instance method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| language | <code>string</code> | 

<a name="Translator+getLanguage"></a>

### translator.getLanguage(language) ⇒ <code>string</code>
**Kind**: instance method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| language | <code>string</code> | 

<a name="Translator+reportMissing"></a>

### translator.reportMissing(componentName, key, [rule]) ⇒ <code>void</code>
Noop

**Kind**: instance method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| componentName | <code>string</code> | 
| key | <code>string</code> | 
| [rule] | <code>string</code> | 

<a name="Translator+translate"></a>

### translator.translate(translations, key, [interpolation], [componentName]) ⇒ <code>string</code>
**Kind**: instance method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| translations | [<code>Translations</code>](#Translations) | 
| key | <code>string</code> | 
| [interpolation] | <code>Object</code> \| <code>number</code> \| <code>Array</code> | 
| [componentName] | <code>string</code> | 

<a name="Translator.initialize"></a>

### Translator.initialize(options, symbol) ⇒ [<code>Translator</code>](#Translator)
**Kind**: static method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| options | [<code>TranslatorOptions</code>](#TranslatorOptions) | 
| symbol | <code>symbol</code> | 

<a name="Translator.interpolate"></a>

### Translator.interpolate(text, interpolation) ⇒ <code>string</code>
**Kind**: static method of [<code>Translator</code>](#Translator)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 
| interpolation | <code>Object</code> | 

<a name="ControllerBond"></a>

## ControllerBond : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| to | <code>string</code> | 
| [parse] | <code>function</code> | 
| [prevent] | <code>boolean</code> | 
| [property] | <code>string</code> | 
| [attribute] | <code>string</code> | 
| [value] | <code>\*</code> | 

<a name="Routes"></a>

## Routes : <code>Object.&lt;string, RegExp&gt;</code>
**Kind**: global typedef  
<a name="Translations"></a>

## Translations : <code>Object.&lt;string, Object.&lt;string, (Object\|string)&gt;&gt;</code>
**Kind**: global typedef  
<a name="TranslatorOptions"></a>

## TranslatorOptions
**Kind**: global typedef  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| [language] | <code>string</code> |  | 
| languages | <code>Array.&lt;string&gt;</code> |  | 
| [translations] | [<code>Translations</code>](#Translations) |  | 
| [globalPrefix] | <code>string</code> | <code>&quot;$&quot;</code> | 

