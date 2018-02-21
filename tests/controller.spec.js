import Listener from '../src/listener';
import Controller from '../src/controller';

window.Element.prototype.closest = function (selector) {
  let el = this;
  while (el) {
    if (el.matches(selector)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
};

window.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
  }
};

describe('Controller', () => {
  let v;
  let el;

  beforeEach(() => {
    v = new Controller();
    Object.defineProperty(v, '_document', { value: window.document, enumerable: false });
    el = document.createElement('div');
    el.setAttribute('id', 'region');
    v.el.appendChild(el);
    v.someMethod = jest.fn();
    v.handlers = v._prepareHandlers({
      click: 'someMethod',
      'click #submit': v.someMethod,
    });
  });

  describe('constructor', () => {
    it('creates a controller instance', () => {
      class Model extends Listener() {}
      const model = new Model();
      Object.defineProperty(model, '_document', { value: window.document, enumerable: false });

      const nv = new Controller({
        tagName: 'ul',
        attributes: {
          class: 'unordered-list',
        },
        handlers: {},
        regions: {
          region: '#region',
        },
        model,
        renderEvents: ['change'],
        renderAttributes: ['data-id'],
      });
      expect(nv instanceof Controller).toBe(true);
      expect(nv.el.className).toBe('unordered-list');
      expect(nv.el.tagName).toBe('UL');
      expect(nv.model).toBe(model);
      expect(nv._regionSelectors.region).toBe('#region');
      expect(nv._regionControllers).toBe(undefined);
      expect(nv._observer instanceof window.MutationObserver).toBe(true);
      expect(nv._observer.observe).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('renders and returns the controller element', () => {
      v.view = jest.fn();
      v.model = {};
      const result = v.render();
      expect(result).toBe(v.el);
      expect(v.view.mock.calls.length).toBe(1);
      expect(v.view.mock.calls[0]).toEqual([v]);
    });

    it('debounces if `renderDebounce` is set', (done) => {
      const nv = new Controller({ renderDebounce: 10 });
      nv.view = jest.fn();
      nv.render();
      nv.render();
      setTimeout(() => {
        expect(nv.view.mock.calls.length).toBe(1);
        done();
      }, 50);
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
      expect(v.handlers.get('mouseover')[0]).toEqual([v.someMethod, '#submit']);
      expect(v.el.addEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls.length).toBe(0);
      expect(v.el.addEventListener.mock.calls[0]).toEqual(['mouseover', v._handle]);
    });

    it('does not attach a handler twice for the same event', () => {
      v.delegate('mouseover', v.someMethod, '#submit');
      v.delegate('mouseover', 'someMethod');
      expect(v.handlers.get('mouseover')[0]).toEqual([v.someMethod, '#submit']);
      expect(v.handlers.get('mouseover')[1]).toEqual(v.someMethod);
      expect(v.el.addEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls.length).toBe(0);
      expect(v.el.addEventListener.mock.calls[0]).toEqual(['mouseover', v._handle]);
    });

    it('does not attach a handler if the callback is not a function', () => {
      v.delegate('mouseover', 'nonExistantCallback', '#submit');
      expect(v.handlers.get('mouseover')).toBe(undefined);
      expect(v.el.addEventListener.mock.calls.length).toBe(0);
    });

    it('attaches all handlers', () => {
      v.delegate();
      expect(v.el.addEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls.length).toBe(1);
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
      expect(v.el.addEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls.length).toBe(2);
    });

    it('detaches a specific handler', () => {
      v.delegate('click', v.someMethod);
      expect(v.handlers.get('click')).toEqual([[v.someMethod, '#submit', undefined], v.someMethod]);
      v.undelegate('click', v.someMethod);
      expect(v.handlers.get('click')).toEqual([[v.someMethod, '#submit', undefined]]);

      v.delegate('mouseover', v.someMethod, '#submit');
      expect(v.handlers.get('mouseover')).toEqual([
        [v.someMethod, '#submit'],
      ]);
      v.undelegate('mouseover', v.someMethod, '#submit');
      expect(v.handlers.get('mouseover')).toBe(undefined);
      expect(v.el.removeEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls[0]).toEqual(['mouseover', v._handle]);
    });
  });

  describe('show', () => {
    let parentController;
    let someController;
    let otherController;
    let spyDispose;
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
      spyDispose = jest.spyOn(someController, 'dispose');
      model = {
        dispose: jest.fn(),
      };
      someController.model = model;


      otherController = new Controller();
      otherController.render = jest.fn().mockReturnValue(otherController.el);
      otherController.dispose = jest.fn();
    });

    afterEach(() => {
      spyDispose.mockRestore();
    });

    it('renders any given DOM nodes inside a given region', () => {
      const regionElement = parentController.el.querySelector('#region');
      const domNode = document.createElement('div');
      expect(regionElement.hasChildNodes()).toBe(false);
      parentController.show('region', domNode);
      expect(regionElement.contains(domNode)).toBe(true);
    });

    it('renders a given controller inside a given region', () => {
      const regionElement = parentController.el.querySelector('#region');
      expect(regionElement.hasChildNodes()).toBe(false);
      parentController.show('region', someController);
      expect(someController.render).toHaveBeenCalled();
      expect(regionElement.contains(someController.el)).toBe(true);
      expect(parentController._regionControllers.region).toBe(someController);
    });

    it('replaces existing nodes and controllers disposing them and their models', () => {
      const regionElement = parentController.el.querySelector('#region');
      parentController.show('region', someController);
      expect(parentController._regionControllers.region).toBe(someController);

      parentController.show('region', otherController);
      expect(someController.dispose).toHaveBeenCalled();
      expect(model.dispose).toHaveBeenCalled();
      expect(otherController.render).toHaveBeenCalled();
      expect(regionElement.contains(otherController.el)).toBe(true);
      expect(parentController._regionControllers.region).toBe(otherController);
    });

    it('does not dispose the existing controller if `keep:true`', () => {
      const regionElement = parentController.el.querySelector('#region');
      parentController.show('region', someController);
      expect(parentController._regionControllers.region).toBe(someController);

      parentController.show('region', otherController, { keep: true });
      expect(someController.dispose).not.toHaveBeenCalled();
      expect(otherController.render).toHaveBeenCalled();
      expect(regionElement.contains(otherController.el)).toBe(true);
      expect(parentController._regionControllers.region).toBe(otherController);
    });

    it('does not dispose the model of the existing controller if `keepModel:true`', () => {
      const regionElement = parentController.el.querySelector('#region');
      parentController.show('region', someController);
      expect(parentController._regionControllers.region).toBe(someController);

      parentController.show('region', otherController, { keepModel: true });
      expect(someController.dispose).toHaveBeenCalled();
      expect(model.dispose).not.toHaveBeenCalled();
      expect(regionElement.contains(otherController.el)).toBe(true);
      expect(parentController._regionControllers.region).toBe(otherController);
    });

    it('does nothing if the region is not found', () => {
      parentController._regionSelectors.region = '#nonexistant';
      parentController.show('region', someController);
      expect(parentController.el.querySelector('#region').hasChildNodes()).toBe(false);
      expect(someController.render).not.toHaveBeenCalled();
    });

    it('does not replace (or re-render) the existing controller with the same controller', () => {
      parentController.show('region', someController);
      expect(someController.render.mock.calls.length).toBe(1);
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

      expect(regionEl.hasChildNodes()).toBe(false);
      regionEl.appendChild(document.createElement('div'));
      expect(regionEl.hasChildNodes()).toBe(true);
      controller.renderRegion(regionEl);
      expect(regionEl.hasChildNodes()).toBe(false);
      controller.renderRegion(regionEl, document.createElement('div'));
      expect(regionEl.hasChildNodes()).toBe(true);
    });
  });

  describe('dispose', () => {
    it('prepares the controller to be disposed', () => {
      v._observeAttributes(['data-id']);
      v.dispose();
      expect(v._observer).toBeUndefined();
    });

    it('removes the controller element from the DOM', () => {
      document.body.appendChild(v.el);
      expect(document.body.contains(v.el)).toBe(true);
      v.dispose();
      expect(document.body.contains(v.el)).toBe(false);
    });

    it('disposes of the regions of the controller', () => {
      v._disposeRegions = jest.fn();
      v.dispose();
      expect(v._disposeRegions).toHaveBeenCalled();
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

  describe('_prepareElement', () => {
    it('creates a valid DOM element if the controller does not have one', () => {
      delete v.el;
      v.el = v._prepareElement();
      expect(v.el.nodeType).toBe(1);
    });

    it('creates a DOM element with the provided attributes', () => {
      delete v.el;
      v.attributes = {
        id: 'content',
        class: 'visible',
      };
      v.el = v._prepareElement();
      expect(v.el.getAttribute('id')).toBe('content');
      expect(v.el.getAttribute('class')).toBe('visible');
    });

    it('sets an existing element as the controller element if selector is provided', () => {
      const div = document.createElement('div');
      div.className = 'someClass';
      document.body.appendChild(div);

      delete v.el;
      v.el = v._prepareElement('.someClass');
      expect(v.el).toBe(div);
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
      v.handlers = v._prepareHandlers({
        'input #name': { bond: 'name' },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
    });

    it('binds to a nested attribute of the model if `nested:true`', () => {
      v.model = { name: {} };
      v.handlers = v._prepareHandlers({
        'input #name': { bond: 'name.first', nested: true },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: { first: '' } });
    });

    it('prevents default action if `prevent:true`', () => {
      v.handlers = v._prepareHandlers({
        'input #name': { bond: 'name', prevent: true },
      });
      v._handle(event);
      expect(v.model).toEqual({ name: '' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      v.parser = parseInt;
      v.handlers = v._prepareHandlers({
        'input #name': { bond: 'id', parse: 'parser' },
      });
      input.value = '1';
      v._handle(event);
      expect(v.model).toEqual({ id: 1 });
    });

    it('debounces handlers if `debounce` is set', () => {
      const spy = jest.spyOn(Controller, '_handleDebounce');
      v.handlers = v._prepareHandlers({
        'input #name': { bond: 'name', debounce: 1000 },
      });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('_prepareHandlers', () => {
    it('transforms `this.handlers` to a usable internal form', () => {
      expect(v.handlers.get('click')[0]).toBe(v.someMethod);
      expect(v.handlers.get('click')[1]).toEqual([v.someMethod, '#submit', undefined]);
    });

    it('skips non-valid callbacks', () => {
      v.handlers = v._prepareHandlers({
        click: 'nonExistantMethod',
      });
      expect(v.handlers.get('click')).toBe(undefined);
    });
  });

  describe('_handle', () => {
    beforeEach(() => {
      v.otherMethod = jest.fn();
      v.yetAnother = jest.fn();
    });

    it('dispatches an event to proper handlers', () => {
      const submit = document.createElement('div');
      submit.setAttribute('id', 'submit');
      v.el.appendChild(submit);
      const event = {
        type: 'click',
        target: submit,
      };
      v.handlers = v._prepareHandlers({
        click: v.otherMethod,
        'click #submit': v.someMethod,
        'click #header': v.yetAnother,
      });
      v._setEventHandlers();
      v._handle(event);
      expect(v.someMethod.mock.calls.length).toBe(1);
      expect(v.otherMethod.mock.calls.length).toBe(1);
      expect(v.yetAnother.mock.calls.length).toBe(0);
      expect(v.someMethod.mock.calls[0]).toEqual([event, submit, undefined]);
      expect(v.otherMethod.mock.calls[0]).toEqual([event, undefined, undefined]);
    });

    it('returns if no handler is set for the event', () => {
      expect(v._handle({ type: 'nonExistantEvent' })).toBe(undefined);
      expect(v.someMethod.mock.calls.length).toBe(0);
      expect(v.otherMethod.mock.calls.length).toBe(0);
      expect(v.yetAnother.mock.calls.length).toBe(0);
    });
  });

  describe('_setEventHandlers', () => {
    beforeEach(() => {
      v.el.addEventListener = jest.fn();
      v.el.removeEventListener = jest.fn();
    });

    it('attaches all event handlers', () => {
      v._setEventHandlers();
      expect(v.el.addEventListener.mock.calls.length).toBe(1);
      expect(v.el.addEventListener.mock.calls[0]).toEqual(['click', v._handle]);
    });

    it('removes all event handlers', () => {
      v._setEventHandlers();
      v._setEventHandlers(true);
      expect(v.el.removeEventListener.mock.calls.length).toBe(1);
      expect(v.el.removeEventListener.mock.calls[0]).toEqual(['click', v._handle]);
    });
  });

  describe('_onRegionDispose', () => {
    it('removes references to a disposed controller from the parent controller', () => {
      const parentController = new Controller({ regions: { region: '#region' } });
      Object.defineProperty(parentController, '_document', { value: window.document, enumerable: false });
      const regionEl = document.createElement('div');
      regionEl.setAttribute('id', 'region');
      parentController.el.appendChild(regionEl);
      jest.spyOn(parentController, '_onRegionDispose');
      const someController = new Controller();
      Object.defineProperty(someController, '_document', { value: window.document, enumerable: false });
      parentController.show('region', someController);
      expect(parentController._regionControllers.region).toBe(someController);
      someController.dispose();
      expect(parentController._onRegionDispose).toHaveBeenCalled();
      expect(parentController._regionControllers.region).toBeUndefined();
      expect(regionEl.hasChildNodes()).toBe(false);
    });

    it('returns if no region is set up', () => {
      const controller = new Controller();
      expect(controller._onRegionDispose(new CustomEvent('dispose', { detail: {} }))).toBeUndefined();
    });
  });

  describe('_disposeRegions', () => {
    it('disposes all regions of the controller', () => {
      const parentController = new Controller({
        regions: {
          regionOne: '#regionone',
          regionTwo: '#regiontwo',
        },
      });
      const regionOne = document.createElement('div');
      regionOne.setAttribute('id', 'regionone');
      const regionTwo = document.createElement('div');
      regionTwo.setAttribute('id', 'regiontwo');
      parentController.el.appendChild(regionOne);
      parentController.el.appendChild(regionTwo);
      const someController = new Controller();
      const otherController = new Controller();
      jest.spyOn(someController, 'dispose');
      jest.spyOn(otherController, 'dispose');

      parentController.show('regionOne', someController);
      parentController.show('regionTwo', otherController);
      expect(parentController._regionControllers).toEqual({
        regionOne: someController,
        regionTwo: otherController,
      });
      parentController._disposeRegions();
      expect(someController.dispose).toHaveBeenCalled();
      expect(otherController.dispose).toHaveBeenCalled();
      expect(parentController._regionControllers).toBeUndefined();
    });
  });

  describe('_observeAttributes', () => {
    it('sets up a MutationObserver to watch for changes in attributes', () => {
      const controller = new Controller();
      expect(controller._observer).toBeUndefined();
      controller._observeAttributes(['data-id']);
      expect(controller._observer instanceof window.MutationObserver).toBe(true);
      expect(controller._observer.observe.mock.calls[0])
        .toEqual([controller.el, { attributes: true, attributeFilter: ['data-id'] }]);
    });

    it('renders the view in response to changes in watched attributes', () => {
      const controller = new Controller();
      controller._observeAttributes(['data-id']);
      jest.spyOn(controller, 'render');
      controller._observer.callback();
      expect(controller.render.mock.calls.length).toBe(1);
      controller.render.mockRestore();
    });
  });

  describe('_handleDebounce', () => {
    it('creates a closure to debounce event handlers for a given time', (done) => {
      const callback = jest.fn();
      const debounce = Controller._handleDebounce(callback, 500);
      expect(typeof debounce).toBe('function');
      debounce();
      debounce();
      setTimeout(() => {
        expect(callback.mock.calls.length).toBe(1);
        done();
      }, 2000);
    });
  });
});
