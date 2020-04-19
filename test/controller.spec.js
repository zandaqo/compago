import { Controller } from '../index';

class Model extends EventTarget {}

describe('Controller', () => {
  let ControllerClass;
  let someMethod;
  let v;

  beforeEach(() => {
    someMethod = jest.fn();
    ControllerClass = class extends Controller {};
    ControllerClass.handlers = {
      click: 'someMethod',
      'click #submit': someMethod,
    };
    ControllerClass.regions = { region: '#region' };
    v = new ControllerClass();
    v.someMethod = jest.fn();
  });

  describe('constructor', () => {
    it('creates a controller instance', () => {
      expect(v instanceof Controller).toBe(true);
      expect(v instanceof ControllerClass).toBe(true);
    });

    it('sets up event handlers', () => {
      ControllerClass.handlers = {
        click: 'render',
        'click #submit': 'navigate',
        focus: 'nonExistantMethod',
      };
      const controller = new ControllerClass();
      expect(controller[Symbol.for('c_handlers')].size).toBe(1);
    });

    it('creates a controller with a model', () => {
      const model = new Model();
      const controller = new ControllerClass({
        model,
      });
      expect(controller.model).toBe(model);
    });

    it('reacts to `popstate` events in a controller with a router', () => {
      jest.spyOn(window, 'addEventListener');
      ControllerClass.routes = {};
      new ControllerClass();
      expect(window.addEventListener.mock.calls.length).toBe(1);
      expect(window.addEventListener.mock.calls[0][0]).toBe('popstate');
      window.addEventListener.mockRestore();
    });
  });

  describe('render', () => {
    it('renders and returns the controller', () => {
      ControllerClass.view = jest.fn();
      const controller = new ControllerClass();
      controller.render();
      expect(ControllerClass.view).toHaveBeenCalled();
    });
  });

  describe('addEventListener', () => {
    beforeEach(() => {
      jest.spyOn(v, 'addEventListener');
      jest.spyOn(v, 'removeEventListener');
    });

    afterEach(() => {
      v.addEventListener.mockRestore();
      v.removeEventListener.mockRestore();
    });

    it('attaches a normal event handler if option `handler` is not present', () => {
      v.addEventListener('mouseover', v.someMethod);
      expect(v.addEventListener).toHaveBeenCalled();
      expect(v[Symbol.for('c_handlers')].get('mouseover')).toBe(undefined);
    });

    it('attaches a handler for a DOM event', () => {
      v.addEventListener('mouseover', v.someMethod, { handler: true, selector: '#submit' });
      expect(v[Symbol.for('c_handlers')].get('mouseover')[0]).toEqual([v.someMethod, '#submit']);
    });

    it('does not attach a handler if the callback is not a function', () => {
      v.addEventListener('mouseover', 'nonExistantCallback', {
        handler: true,
        selector: '#submit',
      });
      expect(v[Symbol.for('c_handlers')].get('mouseover')).toBe(undefined);
    });
  });

  describe('removeEventListener', () => {
    beforeEach(() => {
      jest.spyOn(v, 'addEventListener');
      jest.spyOn(v, 'removeEventListener');
    });

    afterEach(() => {
      v.addEventListener.mockRestore();
      v.removeEventListener.mockRestore();
    });

    it('detaches a normal event handler if option `handler` is not present', () => {
      v.removeEventListener('click', v.someMethod);
      expect(v.removeEventListener).toHaveBeenCalled();
    });

    it('detaches a specific handler', () => {
      v.removeEventListener('click', v.someMethod, { handler: true });
      expect(v[Symbol.for('c_handlers')].get('click').length).toBe(1);

      v.addEventListener('mouseover', v.someMethod, { handler: true, selector: '#submit' });
      v.removeEventListener('mouseover', v.someMethod, { handler: true, selector: '#submit' });
      expect(v[Symbol.for('c_handlers')].get('mouseover')).toBe(undefined);
    });
  });

  describe('navigate', () => {
    let controller;
    const historyState = (state, title, url) => {
      const [path, params] = url.split('?');
      const [search, hash] = params ? params.split('#') : ['', ''];
      ControllerClass[Symbol.for('c_location')] = {
        pathname: path,
        search: search ? `?${search}` : '',
        hash: hash ? `#${hash}` : '',
      };
    };

    beforeEach(() => {
      ControllerClass.routes = {
        home: /^\/$/,
        about: /^\/about$/,
        user: /^\/user\/(?<name>[^/]+)$/,
      };
      ControllerClass[Symbol.for('c_location')] = {};
      ControllerClass[Symbol.for('c_history')] = {
        pushState: jest.fn(historyState),
        replaceState: jest.fn(historyState),
      };
      controller = new ControllerClass();
    });

    it('saves a url into browser history', () => {
      controller.navigate('/path');
      expect(ControllerClass[Symbol.for('c_history')].pushState).toHaveBeenCalled();
    });

    it('replaces the current url if `replace:true`', () => {
      controller.navigate('/path', { replace: true });
      expect(ControllerClass[Symbol.for('c_history')].replaceState).toHaveBeenCalled();
    });

    it('checks the current url if no new url provided', () => {
      expect(controller[Symbol.for('c_fragment')]).toBe('');
      ControllerClass[Symbol.for('c_location')] = {
        pathname: '/foo',
      };
      controller.navigate();
      expect(controller[Symbol.for('c_fragment')]).toEqual('/foo');
    });

    it('handles custom roots while checking the url', () => {
      ControllerClass.root = '/user';
      ControllerClass[Symbol.for('c_location')].pathname = '/user';
      controller.navigate();
      expect(controller[Symbol.for('c_fragment')]).toEqual('');
      controller.navigate('/abc');
      expect(controller[Symbol.for('c_fragment')]).toEqual('/abc');
    });

    it('checks the new url against routes unless `silent:true`', () => {
      controller._checkUrl = jest.fn();
      controller.navigate('/path', { silent: true });
      expect(controller._checkUrl).not.toHaveBeenCalled();
      controller.navigate('/');
      expect(controller._checkUrl).toHaveBeenCalled();
    });

    it('does not update history if the url is unchanged', () => {
      controller.navigate('/about');
      controller.navigate('/about');
      expect(ControllerClass[Symbol.for('c_history')].pushState).toHaveBeenCalledTimes(1);
    });

    it('emits `route` event if the url matches a route', () => {
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      controller.navigate('/about');
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      controller.navigate('/user/arthur');
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].detail).toMatchObject({
        route: 'user',
        params: {
          name: 'arthur',
        },
      });
    });

    it('sends query and hash parameters with the `route` event', () => {
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      controller.navigate('/user/arthur?a=b#c');
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].detail).toMatchObject({
        route: 'user',
        params: {
          name: 'arthur',
        },
        query: '?a=b',
        hash: '#c',
      });
    });

    it('can be used if no routes are specified', () => {
      ControllerClass.routes = {};
      const anotherController = new ControllerClass();
      anotherController.navigate('/abc');
      expect(ControllerClass[Symbol.for('c_history')].pushState).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('removes the controller element from the DOM', () => {
      const parentNode = { removeChild: jest.fn() };
      v.parentNode = parentNode;
      v.dispose();
      expect(parentNode.removeChild.mock.calls).toEqual([[v]]);
    });

    it('disposes the model unless `save:true`', () => {
      const model = {
        dispose: jest.fn(),
      };

      v.model = model;
      v.dispose({ save: true });
      expect(model.dispose).not.toHaveBeenCalled();
      expect(v.model).toBe(undefined);

      v.model = model;
      v.dispose();
      expect(model.dispose).toHaveBeenCalled();
      expect(v.model).toBe(undefined);
    });

    it('removes event listeners from the model', () => {
      const model = new Model();
      ControllerClass.observedAttributes = [':a'];
      jest.spyOn(model, 'removeEventListener');
      const controller = new ControllerClass({ model });
      controller._observeAttributes();
      controller.dispose();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller._onModelChange);
      model.removeEventListener.mockRestore();
    });

    it('removes event listener for `popstate` event', () => {
      jest.spyOn(window, 'removeEventListener');
      ControllerClass.routes = {};
      const controller = new ControllerClass();
      controller.dispose();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        controller._onPopstateEvent,
      );
      window.removeEventListener.mockRestore();
    });

    it('fires `dispose` event unless `silent:true`', () => {
      v.addEventListener('dispose', v.someMethod);
      v.dispose();
      expect(v.someMethod).toHaveBeenCalled();

      v.otherMethod = jest.fn();
      v.addEventListener('dispose', v.otherMethod);
      v.dispose({ silent: true });
      expect(v.otherMethod).not.toHaveBeenCalled();
    });
  });

  describe('connectedCallback', () => {
    it('subscribes to model events upon connecting to the DOM', () => {
      v._observeAttributes = jest.fn();
      v.model = {};
      v.connectedCallback();
      expect(v._observeAttributes).toHaveBeenCalled();
    });
  });

  describe('disconnectedCallback', () => {
    it('disposes of the controller upon disconnecting from the DOM', () => {
      v.dispose = jest.fn();
      v.disconnectedCallback();
      expect(v.dispose).toHaveBeenCalled();
    });
  });

  describe('attributeChangedCallback', () => {
    it('dispatches `attributes` event upon changing observed attributes of the controller', () => {
      v._dispatchAttributesEvent = jest.fn();
      v.attributeChangedCallback();
      expect(v._dispatchAttributesEvent).toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    it('debounces a given function is set', (done) => {
      const cb = jest.fn();
      const debounced = Controller.debounce(cb, 20);
      debounced();
      debounced();
      setTimeout(() => {
        expect(cb.mock.calls.length).toBe(1);
        done();
      }, 50);
    });
  });

  describe('observedAttributes', () => {
    it('dispatches `attribute` event if observed attributes of a model change', (done) => {
      const model = new Model();
      ControllerClass.observedAttributes = [':a'];
      const controller = new ControllerClass({ model });
      controller.connectedCallback();
      jest
        .spyOn(controller, 'render')
        .mockImplementation(({ detail: { emitter, attribute, previous } }) => {
          expect(emitter).toBe(controller);
          expect(attribute).toBe(':a');
          expect(previous).toBeUndefined();
          done();
        });
      controller.addEventListener('attributes', controller.render, { handler: true });
      model.dispatchEvent(
        new CustomEvent('change', { detail: { path: ':b', previous: undefined } }),
      );
      model.dispatchEvent(
        new CustomEvent('change', { detail: { path: ':a', previous: undefined } }),
      );
    });

    it('dispatches `attribute` event on any model change if `:` attribute is observed', (done) => {
      const model = new Model();
      ControllerClass.observedAttributes = [':'];
      const controller = new ControllerClass({ model });
      controller.connectedCallback();
      jest.spyOn(controller, 'render');
      controller.addEventListener('attributes', controller.render, { handler: true });
      model.dispatchEvent(
        new CustomEvent('change', { detail: { path: ':b', previous: undefined } }),
      );
      model.dispatchEvent(
        new CustomEvent('change', { detail: { path: ':a', previous: undefined } }),
      );
      setTimeout(() => {
        expect(controller.render.mock.calls.length).toBe(2);
        done();
      }, 100);
    });

    it('dispatches `attribute` event if observed attributes of a controller element change', (done) => {
      ControllerClass.observedAttributes = ['data-id'];
      const controller = new ControllerClass();
      jest
        .spyOn(controller, 'render')
        .mockImplementation(({ detail: { emitter, attribute, previous } }) => {
          expect(emitter).toBe(controller);
          expect(attribute).toBe('data-id');
          expect(previous).toBeUndefined();
          done();
        });
      controller.addEventListener('attributes', controller.render, { handler: true });
      controller.attributeChangedCallback('data-id', undefined);
    });
  });

  describe('_handle', () => {
    it('handles `attributes` event', () => {
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        attributes: 'someMethod',
      });
      v._setEventHandlers();
      v._dispatchAttributesEvent(':a', undefined);
      expect(v.someMethod.mock.calls.length).toBe(1);
    });

    it('handles `attributes` event with a selector', () => {
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'attributes :a': 'someMethod',
      });
      v._setEventHandlers();
      v._dispatchAttributesEvent(':b', undefined);
      v._dispatchAttributesEvent(undefined, undefined);
      expect(v.someMethod).not.toHaveBeenCalled();
      v._dispatchAttributesEvent(':a:b', undefined);
      expect(v.someMethod.mock.calls.length).toBe(1);
    });

    it('handles multiple callbacks for `attributes` events', () => {
      const anotherMethod = jest.fn();
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'attributes :a': 'someMethod',
        attributes: anotherMethod,
      });
      v._setEventHandlers();
      v._dispatchAttributesEvent(':b', undefined);
      expect(v.someMethod).not.toHaveBeenCalled();
      expect(anotherMethod.mock.calls.length).toBe(1);
      v._dispatchAttributesEvent(':a:b', undefined);
      expect(v.someMethod.mock.calls.length).toBe(1);
      expect(anotherMethod.mock.calls.length).toBe(2);
    });
  });

  describe('_handleBond', () => {
    let input;
    let event;

    beforeEach(() => {
      v.model = {};
      v.contains = jest.fn(() => true);
      input = document.createElement('input');
      input.setAttribute('id', 'name');
      event = { type: 'input', target: input, preventDefault: jest.fn() };
    });

    it('handles one way binding between DOM elements and the model', () => {
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: ':name' },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
    });

    it('binds to a nested attribute of the model if attribute name contains `.`', () => {
      v.model = { name: {} };
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: ':name.first' },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: { first: '' } });
    });

    it('binds to attributes of the controller', () => {
      v.setAttribute = jest.fn();
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: 'data-name', nested: true },
      });
      v._handle(event);
      expect(v.setAttribute.mock.calls[0]).toEqual(['data-name', '']);
    });

    it('prevents default action if `prevent:true`', () => {
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: ':name', prevent: true },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      v.parser = parseInt;
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: ':id', parse: 'parser' },
      });
      input.value = '1';
      v._handle(event);
      expect(v.model).toEqual({ id: 1 });
    });

    it('debounces handlers if `debounce` is set', () => {
      jest.spyOn(Controller, 'debounce');
      v[Symbol.for('c_handlers')] = v._prepareHandlers({
        'input #name': { bond: ':name', debounce: 1000 },
      });
      expect(Controller.debounce).toHaveBeenCalled();
      Controller.debounce.mockRestore();
    });
  });

  describe('_onPopstateEvent', () => {
    it('checks the current URL upon recieving a `popstate` event from the window', () => {
      v._checkUrl = jest.fn();
      v._getFragment = jest.fn(() => 'new_fragment');
      v._onPopstateEvent();
      expect(v._checkUrl).toHaveBeenCalled();
    });

    it('does not check the URL if the fragment has not changed', () => {
      v._checkUrl = jest.fn();
      v._getFragment = jest.fn(() => 'old_fragment');
      v[Symbol.for('c_fragment')] = 'old_fragment';
      v._onPopstateEvent();
      expect(v._checkUrl).not.toHaveBeenCalled();
    });
  });
});
