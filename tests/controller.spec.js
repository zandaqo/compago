import Listener from '../src/listener';
import Controller from '../src/controller';

window.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
  }
};

class Model extends Listener() {}

describe('Controller', () => {
  let v;
  let el;

  beforeEach(() => {
    v = new Controller();
    el = document.createElement('div');
    el.setAttribute('id', 'region');
    v.el.appendChild(el);
    v.someMethod = jest.fn();
    v._handlers = v._prepareHandlers({
      click: 'someMethod',
      'click #submit': v.someMethod,
    });
  });

  describe('constructor', () => {
    it('creates a controller instance', () => {
      const controller = new Controller();
      expect(controller instanceof Controller).toBe(true);
    });

    it('sets controller element from selector', () => {
      const elem = document.createElement('div');
      elem.className = 'someClass';
      document.body.appendChild(elem);
      const controller = new Controller({
        el: '.someClass',
      });
      expect(controller.el).toBe(elem);
      document.body.removeChild(elem);
    });

    it('creates a controller element with specified tag and attributes', () => {
      const controller = new Controller({
        tagName: 'ul',
        attributes: {
          class: 'unordered-list',
        },
      });
      expect(controller.el.className).toBe('unordered-list');
      expect(controller.el.tagName).toBe('UL');
    });

    it('sets up event handlers', () => {
      const handlers = {
        click: 'render',
        'click #submit': 'navigate',
        focus: 'nonExistantMethod',
      };
      const controller = new Controller({ handlers });
      jest.spyOn(controller, 'render');
      jest.spyOn(controller, 'navigate');
      // re-init handlers to let jest spy on them
      controller._handlers = controller._prepareHandlers(handlers);
      controller.el.click();
      expect(controller.render).toHaveBeenCalled();
      expect(controller.navigate).not.toHaveBeenCalled();
    });

    it('creates a controller with a model', () => {
      const model = new Model();
      const controller = new Controller({
        model,
      });
      expect(controller.model).toBe(model);
    });

    it('creates a contoller with a view', () => {
      const view = jest.fn();
      const controller = new Controller({
        view,
      });
      expect(controller.view).toBe(view);
    });

    it('creates a controller with regions', () => {
      const controller = new Controller({
        regions: {
          region: '#region',
        },
      });
      expect(controller._regionSelectors.region).toBe('#region');
      expect(controller._regionControllers).toBe(undefined);
    });

    it('handles removal of regions', () => {
      const parentController = new Controller({ regions: { region: '#region' } });
      const regionEl = document.createElement('div');
      regionEl.setAttribute('id', 'region');
      parentController.el.appendChild(regionEl);
      const someController = new Controller();
      parentController.show('region', someController);
      expect(parentController._regionControllers.region).toBe(someController);
      expect(regionEl.hasChildNodes()).toBe(true);
      someController.dispose();
      expect(parentController._regionControllers.region).toBeUndefined();
      expect(regionEl.hasChildNodes()).toBe(false);
    });

    it('creates a controller with router capabilities', () => {
      const root = '/subdomain';
      const controller = new Controller({
        root,
        routes: {
          user: '/user/:username',
          category: '/category/:categoryname',
        },
      });
      expect(controller._root).toBe(root);
      expect(controller._routes.length).toBe(2);
    });

    it('reacts to `popstate` events in a controller with a router', () => {
      const controller = new Controller({
        routes: {},
      });
      controller._checkUrl = jest.fn();
      window.dispatchEvent(new Event('popstate'));
      expect(controller._checkUrl).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('renders and returns the controller element', () => {
      v.view = jest.fn();
      v.model = {};
      const result = v.render();
      expect(result).toBe(v.el);
      expect(v.view.mock.calls).toEqual([[v]]);
    });
  });

  describe('delegate', () => {
    beforeEach(() => {
      v.undelegate();
      v.el.addEventListener = jest.fn();
      v.el.removeEventListener = jest.fn();
    });

    it('attaches a handler for a DOM event', () => {
      v.delegate('mouseover', v.someMethod, '#submit');
      expect(v._handlers.get('mouseover')[0]).toEqual([v.someMethod, '#submit']);
      expect(v.el.addEventListener.mock.calls).toEqual([['mouseover', v._handle]]);
    });

    it('does not attach a handler twice for the same event', () => {
      v.delegate('mouseover', v.someMethod, '#submit');
      v.delegate('mouseover', 'someMethod');
      expect(v.el.addEventListener.mock.calls).toEqual([['mouseover', v._handle]]);
    });

    it('does not attach a handler if the callback is not a function', () => {
      v.delegate('mouseover', 'nonExistantCallback', '#submit');
      expect(v._handlers.get('mouseover')).toBe(undefined);
      expect(v.el.addEventListener).not.toHaveBeenCalled();
    });

    it('attaches all handlers', () => {
      v.delegate();
      expect(v.el.addEventListener).toHaveBeenCalled();
      expect(v.el.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('undelegate', () => {
    beforeEach(() => {
      v.undelegate();
      v.el.addEventListener = jest.fn();
      v.el.removeEventListener = jest.fn();
    });

    it('detaches all handlers', () => {
      v.delegate();
      v.undelegate();
      expect(v.el.addEventListener).toHaveBeenCalled();
      expect(v.el.removeEventListener.mock.calls.length).toBe(2);
    });

    it('detaches a specific handler', () => {
      v.delegate('click', v.someMethod);
      v.undelegate('click', v.someMethod);
      expect(v._handlers.get('click')).toEqual([[v.someMethod, '#submit', undefined]]);

      v.delegate('mouseover', v.someMethod, '#submit');
      v.undelegate('mouseover', v.someMethod, '#submit');
      expect(v._handlers.get('mouseover')).toBe(undefined);
      expect(v.el.removeEventListener.mock.calls).toEqual([['mouseover', v._handle]]);
    });
  });

  describe('show', () => {
    let parentController;
    let someController;
    let otherController;
    let model;

    beforeEach(() => {
      parentController = new Controller({
        regions: {
          region: '#region',
        },
      });
      const regionEl = document.createElement('div');
      regionEl.setAttribute('id', 'region');
      parentController.el.appendChild(regionEl);

      someController = new Controller();
      someController.render = jest.fn().mockReturnValue(someController.el);
      jest.spyOn(someController, 'dispose');
      model = {
        dispose: jest.fn(),
      };
      someController.model = model;

      otherController = new Controller();
      otherController.render = jest.fn().mockReturnValue(otherController.el);
      otherController.dispose = jest.fn();
    });

    afterEach(() => {
      someController.dispose.mockRestore();
    });

    it('renders any given DOM nodes inside a given region', () => {
      const regionElement = parentController.el.querySelector('#region');
      const domNode = document.createElement('div');
      parentController.show('region', domNode);
      expect(regionElement.contains(domNode)).toBe(true);
    });

    it('renders a given controller inside a given region', () => {
      const regionElement = parentController.el.querySelector('#region');
      parentController.show('region', someController);
      expect(someController.render).toHaveBeenCalled();
      expect(regionElement.contains(someController.el)).toBe(true);
      expect(parentController._regionControllers.region).toBe(someController);
    });

    it('replaces existing nodes and controllers disposing them and their models', () => {
      parentController.show('region', someController);
      parentController.show('region', otherController);
      expect(someController.dispose).toHaveBeenCalled();
      expect(model.dispose).toHaveBeenCalled();
      expect(otherController.render).toHaveBeenCalled();
    });

    it('does not dispose the existing controller if `keep:true`', () => {
      parentController.show('region', someController);
      parentController.show('region', otherController, { keep: true });
      expect(someController.dispose).not.toHaveBeenCalled();
    });

    it('does not dispose the model of the existing controller if `keepModel:true`', () => {
      parentController.show('region', someController);
      parentController.show('region', otherController, { keepModel: true });
      expect(model.dispose).not.toHaveBeenCalled();
    });

    it('does nothing if the region is not found', () => {
      parentController._regionSelectors.region = '#nonexistant';
      parentController.show('region', someController);
      expect(parentController.el.querySelector('#region').hasChildNodes()).toBe(false);
      expect(someController.render).not.toHaveBeenCalled();
    });

    it('does not replace (or re-render) the existing controller with the same controller', () => {
      parentController.show('region', someController);
      parentController.show('region', someController);
      expect(someController.render.mock.calls.length).toBe(1);
    });
  });

  describe('renderRegion', () => {
    it('renders content inside a given region', () => {
      const controller = new Controller({
        regions: {
          region: '#region',
        },
      });
      const regionEl = document.createElement('div');
      regionEl.setAttribute('id', 'region');
      controller.el.appendChild(regionEl);
      regionEl.appendChild(document.createElement('div'));
      controller.renderRegion(regionEl);
      expect(regionEl.hasChildNodes()).toBe(false);
      controller.renderRegion(regionEl, document.createElement('div'));
      expect(regionEl.hasChildNodes()).toBe(true);
    });
  });

  describe('navigate', () => {
    let controller;

    beforeEach(() => {
      controller = new Controller({
        routes: {
          home: '/',
          about: '/about',
          user: '/user/:name',
        },
      });
      jest.spyOn(window.history, 'replaceState').mockImplementation(() => true);
      jest.spyOn(window.history, 'pushState').mockImplementation(() => true);
    });

    afterEach(() => {
      window.history.replaceState.mockRestore();
      window.history.pushState.mockRestore();
    });

    it('saves a url into browser history', () => {
      controller.navigate('/path');
      expect(window.history.pushState).toHaveBeenCalled();
    });

    it('replaces the current url if `replace:true`', () => {
      controller.navigate('/path', { replace: true });
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('checks the current url if no new url provided', () => {
      expect(controller._fragment).toBe('');
      controller.navigate();
      expect(controller._fragment).toEqual('blank');
    });

    it('checks the new url against routes unless `silent:true`', () => {
      controller._checkUrl = jest.fn();
      controller.navigate('/path', { silent: true });
      expect(controller._checkUrl).not.toHaveBeenCalled();
      controller.navigate('/');
      expect(controller._checkUrl).toHaveBeenCalled();
    });

    it('does not update history if the url is unchanged', () => {
      controller.navigate('/path');
      controller.navigate('/path');
      expect(window.history.pushState).toHaveBeenCalledTimes(1);
    });

    it('emits `route` event if the url matches a route', () => {
      const callback = jest.fn();
      controller.delegate('route', callback);
      controller.navigate('/about');
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      const callback = jest.fn();
      controller.delegate('route', callback);
      controller.navigate('/user/arthur');
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].detail).toMatchObject({
        route: 'user',
        params: {
          name: 'arthur',
        },
      });
    });
  });

  describe('dispose', () => {
    it('prepares the controller to be disposed', () => {
      class ObservedController extends Controller {}
      ObservedController.observedAttributes = ['data-id'];
      const controller = new ObservedController();
      controller.dispose();
      expect(controller._observer).toBeUndefined();
    });

    it('removes the controller element from the DOM', () => {
      document.body.appendChild(v.el);
      expect(document.body.contains(v.el)).toBe(true);
      v.dispose();
      expect(document.body.contains(v.el)).toBe(false);
    });

    it('disposes of the regions of the controller', () => {
      const controller = new Controller({ regions: { one: '#region' } });
      const regionEl = document.createElement('div');
      regionEl.setAttribute('id', 'region');
      controller.el.appendChild(el);
      const regionController = new Controller();
      jest.spyOn(regionController, 'dispose');
      controller.show('one', regionController);
      controller.dispose();
      expect(regionController.dispose).toHaveBeenCalled();
      expect(controller._regionControllers).toBeUndefined();
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
      class ObservedController extends Controller {}
      ObservedController.observedAttributes = [':a'];
      jest.spyOn(model, 'removeEventListener');
      const controller = new ObservedController({ model });
      controller.dispose();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller._onModelChange);
      model.removeEventListener.mockRestore();
    });

    it('removes event listener for `popstate` event', () => {
      jest.spyOn(window, 'removeEventListener');
      const controller = new Controller({ routes: {} });
      controller.dispose();
      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', controller._onPopstateEvent);
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
    class ObservedController extends Controller {}

    it('dispatches `attribute` event if observed attributes of a model change', (done) => {
      const model = new Model();
      ObservedController.observedAttributes = [':a'];
      const controller = new ObservedController({
        model,
      });
      jest.spyOn(controller, 'render').mockImplementation(({ detail: { emitter, attribute, previous } }) => {
        expect(emitter).toBe(controller);
        expect(attribute).toBe(':a');
        expect(previous).toBeUndefined();
        done();
      });
      controller.delegate('attributes', controller.render);
      model.dispatchEvent(new CustomEvent('change', { detail: { path: ':b', previous: undefined } }));
      model.dispatchEvent(new CustomEvent('change', { detail: { path: ':a', previous: undefined } }));
    });

    it('dispatches `attribute` event on any model change if `:` attribute is observed', (done) => {
      const model = new Model();
      ObservedController.observedAttributes = [':'];
      const controller = new ObservedController({
        model,
      });
      jest.spyOn(controller, 'render');
      controller.delegate('attributes', controller.render);
      model.dispatchEvent(new CustomEvent('change', { detail: { path: ':b', previous: undefined } }));
      model.dispatchEvent(new CustomEvent('change', { detail: { path: ':a', previous: undefined } }));
      setTimeout(() => {
        expect(controller.render.mock.calls.length).toBe(2);
        done();
      }, 100);
    });

    it('dispatches `attribute` event if observed attributes of a controller element change', (done) => {
      ObservedController.observedAttributes = ['data-id'];
      const controller = new ObservedController();
      jest.spyOn(controller, 'render').mockImplementation(({ detail: { emitter, attribute, previous } }) => {
        expect(emitter).toBe(controller);
        expect(attribute).toBe('data-id');
        expect(previous).toBeUndefined();
        done();
      });
      controller.delegate('attributes', controller.render);
      controller._observer.callback({ attributeName: 'data-id', oldValue: undefined });
    });
  });

  describe('_handleBond', () => {
    let input;
    let event;

    beforeEach(() => {
      v.model = {};
      input = document.createElement('input');
      input.setAttribute('id', 'name');
      v.el.appendChild(input);
      event = { type: 'input', target: input, preventDefault: jest.fn() };
    });

    it('handles one way binding between DOM elements and the model', () => {
      v._handlers = v._prepareHandlers({
        'input #name': { bond: 'name' },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
    });

    it('binds to a nested attribute of the model if `nested:true`', () => {
      v.model = { name: {} };
      v._handlers = v._prepareHandlers({
        'input #name': { bond: 'name.first', nested: true },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: { first: '' } });
    });

    it('prevents default action if `prevent:true`', () => {
      v._handlers = v._prepareHandlers({
        'input #name': { bond: 'name', prevent: true },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      v.parser = parseInt;
      v._handlers = v._prepareHandlers({
        'input #name': { bond: 'id', parse: 'parser' },
      });
      input.value = '1';
      v._handle(event);
      expect(v.model).toEqual({ id: 1 });
    });

    it('debounces handlers if `debounce` is set', () => {
      jest.spyOn(Controller, 'debounce');
      v._handlers = v._prepareHandlers({
        'input #name': { bond: 'name', debounce: 1000 },
      });
      expect(Controller.debounce).toHaveBeenCalled();
      Controller.debounce.mockRestore();
    });
  });
});
