/* eslint-env browser */

import pathToRegExp from 'path-to-regexp';
import qs from 'querystring';
import Listener from './listener';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/** Cached regex for stripping leading and trailing slashes. */
const _reStartingSlash = /^\/+/g;

/** Cached regex for removing trailing slashes. */
const _reTrailingSlash = /\/+$/g;

/**
 * Handles client-side routing and navigation utilizing the History API.
 *
 * @mixes Listener
 */
class Router {

  /**
   * @param {Object} [options]
   * @param {Object} [options.routes] a hash of routes
   * @param {string} [options.root]
   * @example
   * new Router({ routes: {
   *                        'home':'/',
   *                        'profile': 'users/:name',
   *                        'post': 'posts/:date/:slug'
   *                      },
   *           });
   */
  constructor({ routes = {}, root } = _opt) {
    Object.assign(this, Listener);
    this.routes = [];
    this.root = root ? (`/${root}`).replace(_reStartingSlash, '/').replace(_reTrailingSlash, '') : '';
    this.started = false;
    this.location = window.location;
    this.history = window.history;
    this.fragment = '';
    this._onPopstateEvent = this._onPopstateEvent.bind(this);
    const names = Object.keys(routes);
    for (let i = 0, l = names.length; i < l; i++) {
      const name = names[i];
      this.addRoute(name, routes[name]);
    }
  }

  /**
   * Adds a route to the collection of routes.
   *
   * @param {string} name the route name
   * @param {string} route the path string
   * @returns {this}
   * @example
   * router.addRoute('home', '/');
   * // adds a route named home with the path '/' to the routes list so that every time user
   * // navigates to the root URL the router emit `route:home` event
   *
   * router.addRoute('profile', '/users/:name');
   * // if user visits `/users/JohnDoe` router will fire `route:profile`
   * // with `event.params.name` set to `JohnDoe`
   */
  addRoute(name, route) {
    const parsedRoute = pathToRegExp(route);
    parsedRoute.route = name;
    this.routes.push(parsedRoute);
    return this;
  }

  /**
   * Removes a route from the collection of routes.
   *
   * @param {string} name the route name to be removed
   * @returns {this}
   * @example
   * router.removeRoute('home');
   * // if present, route named 'home' will be removed from the routes list
   */
  removeRoute(name) {
    const routes = this.routes;
    for (let i = 0, l = routes.length; i < l; i++) {
      if (routes[i].route === name) {
        routes.splice(i, 1);
        return this;
      }
    }
    return this;
  }


  /**
   * Starts the router enabling it to handle URL changes.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid attempting to load the current URL fragment
   * @throws {Error} if the support for History API could not be found
   * @returns {this}
   * @example
   * router.start();
   * // starts to listen to URL changes checking them against the routes list, upon start checks
   * // the current URL for routes
   *
   * router.start({ silent: true });
   * //starts the router without checking the current URL
   */
  start({ silent } = _opt) {
    if (this.started) return this;
    if (!this.history.pushState) throw new Error('The browser does not support History API.');
    this.started = true;
    window.addEventListener('popstate', this._onPopstateEvent);
    if (!silent) this._checkUrl();
    return this;
  }

  /**
   * Stops the router preventing it from handling URL changes.
   *
   * @returns {this}
   */
  stop() {
    window.removeEventListener('popstate', this._onPopstateEvent);
    this.started = false;
    return this;
  }

  /**
   * Saves a fragment into the browser history.
   *
   * @param {string} fragment a properly URL-encoded fragment to place into the history
   * @param {Object} [options]
   * @param {boolean} [options.replace] whether to change the current item in the history
   *                                    instead of adding a new one
   * @param {boolean} [options.silent]  whether to avoid checking the fragment for routes
   * @returns {boolean}
   * @example
   * router.navigate('/users');
   * // sets the current URL to '/users', pushes it into history, and checks the new URL for routes
   *
   * router.navigate('/users', { replace: true });
   * // replaces the current URL with '/users' and checks it for routes
   *
   * routes.navigate('/users', { silent: true });
   * // does not check the new URL for routes
   */
  navigate(fragment, { replace, silent } = _opt) {
    if (!this.started) return false;
    const path = this._getFragment(fragment);
    if (this.fragment === path) return false;
    this.fragment = path;
    const url = this.root + path;
    this.history[replace ? 'replaceState' : 'pushState']({}, document.title, url);
    if (!silent) this._checkUrl(path);
    return true;
  }

  /**
   * Prepares the router to be disposed.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing `dispose` event
   * @returns {this}
   * @example
   * router.dispose();
   * // stops the router, removes the routes and event listeners
   */
  dispose({ silent } = _opt) {
    if (!silent) this.emit('dispose');
    this.stop();
    this.routes = [];
    this.off().free();
    return this;
  }

  /**
   * Gets the current pathname.
   *
   * @param {string} [fragment]
   * @returns {string}
   */
  _getFragment(fragment) {
    if (fragment !== undefined) return fragment.trim();
    const root = this.root;
    const location = this.location;
    let newFragment = decodeURIComponent(location.pathname + location.search + location.hash);
    if (root && newFragment.startsWith(root)) newFragment = newFragment.slice(root.length);
    return newFragment;
  }

  /**
   * Checks whether the URL fragment's been changed.
   *
   * @returns {void}
   */
  _onPopstateEvent() {
    const current = this._getFragment();
    if (current === this.fragment) return;
    this._checkUrl();
  }

  /**
   * Checks the fragment against routes and emits `route` events if an appropriate route is found.
   *
   * @param {string} fragment
   * @returns {boolean}
   */
  _checkUrl(fragment) {
    this.fragment = this._getFragment(fragment);
    const [pathString, hash] = this.fragment.split('#', 2);
    const [path, queryString] = pathString.split('?', 2);
    for (let i = 0, l = this.routes.length; i < l; i++) {
      const route = this.routes[i];
      if (route.test(path)) {
        const params = this.constructor._extractParameters(route, path);
        const query = qs.parse(queryString);
        const name = route.route;
        const data = { route: name, params, query, hash };
        this.emit(`route:${name}`, data);
        this.emit('route', data);
        return true;
      }
    }
    return false;
  }

  /**
   * Gets an array of extracted parameters from a URL fragment.
   *
   * @param {RegExp} route
   * @param {string} path
   * @returns {Object}
   */
  static _extractParameters(route, path) {
    const matches = route.exec(path);
    const params = {};
    if (matches.length < 2) return params;
    const keys = route.keys;
    let n = 0;
    for (let i = 1, len = matches.length; i < len; ++i) {
      const key = keys[i - 1];
      const prop = key ? key.name : n++;
      const val = (typeof matches[i] !== 'string') ? matches[i] : decodeURIComponent(matches[i]);

      if (val !== undefined || !params.hasOwnProperty(prop)) {
        params[prop] = val;
      }
    }
    return params;
  }
}

export default Router;
