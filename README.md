# Compago

[![npm](https://img.shields.io/npm/v/compago.svg?style=flat-square)](https://www.npmjs.com/package/compago)
[![David-dm](https://david-dm.org/scriptare/compago.svg?style=flat-square)](https://david-dm.org/scriptare/compago)
[![Travis branch](https://img.shields.io/travis/scriptare/compago.svg?style=flat-square)](https://travis-ci.org/scriptare/compago)
[![Codecov](https://img.shields.io/codecov/c/github/scriptare/compago.svg?style=flat-square)](https://codecov.io/github/scriptare/compago)
[![Code Climate](https://img.shields.io/codeclimate/github/scriptare/compago.svg?style=flat-square)](https://codeclimate.com/github/scriptare/compago)

A minimalist MVC framework for building Single Page Applications using the power of ES2015 and modern browsers. 
Compago evolved from [Backbone.js](http://backbonejs.org) with which it shares the general approach 
to architecture as well as similarities in API.


## Features
 * No support for older browsers including Internet Explorer.
 * No large dependencies such as jQuery, underscore, etc.
 * As a result: small size (17kb), simple API, and concise syntax.
 * Encourages strict implementation of MVC architecture and separation of concerns.
 * Strict control of the life-cycle of its objects through the use of class constructors and `dispose` methods as destructors.
 * And all other features expected from a modern MV* framework:
   * an event system;
   * one-way data binding and data synchronization;
   * declarative handling of DOM events;
   * non-opinionated approach to the View layer that allows the use of any rendering or templating engine;
   * simple router that uses Express-style path strings.


## Installation
Install it from npm repository:
```
npm install compago --save
```

Import modules as needed:
```js
import { Model, Controller } from 'compago';
```

## Example
 * [compago-todo](https://github.com/scriptare/compago-todo) An example of a Todo app that uses JSX and Incremental DOM for Views.
