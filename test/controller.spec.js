import { jest } from '@jest/globals';
import { Controller, Translator } from '../index.js';

class Model extends EventTarget {
  toJSON() {
    return { ...this };
  }
}
class ControllerClass extends Controller {}
ControllerClass.translations = { en: { two: 'two' }, es: { two: 'dos' } };
globalThis.customElements.define('c-controller', ControllerClass);

const translator = Translator.initialize({ languages: ['en', 'es'] });

describe('Controller', () => {
  let controller;
  beforeEach(() => {
    controller = document.createElement('c-controller');
  });

  describe('connectedCallback', () => {
    it('subscribes to model events if model is present', () => {});

    it('subscribes to language change event if global translator is set', () => {
      jest.spyOn(translator, 'addEventListener');
      controller.connectedCallback();
      expect(translator.addEventListener).toHaveBeenCalledWith(
        'language',
        controller.onLanguageChange,
      );
      translator.addEventListener.mockRestore();
    });
  });

  describe('disconnectedCallback', () => {
    it('removes its model', () => {
      const model = new Model();
      controller.model = model;
      jest.spyOn(model, 'removeEventListener');
      controller.connectedCallback();
      controller.disconnectedCallback();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
    });

    it('removes its routes', () => {
      controller.routes = {};
      expect(controller.routes).toBeDefined();
      controller.disconnectedCallback();
      expect(controller.routes).toBeUndefined();
    });

    it('removes an event listener from the global translator', () => {
      jest.spyOn(translator, 'removeEventListener');
      controller.disconnectedCallback();
      expect(translator.removeEventListener).toHaveBeenCalledWith(
        'language',
        controller.onLanguageChange,
      );
      translator.removeEventListener.mockRestore();
    });
  });

  describe('model', () => {
    it('sets a model', () => {
      const model = new Model();
      jest.spyOn(model, 'addEventListener');
      expect(controller.model).toBeUndefined();
      controller.model = model;
      controller.model = model;
      expect(model.addEventListener.mock.calls.length).toBe(1);
      expect(model.addEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
      expect(controller.model).toBe(model);
    });

    it('replaces an existing model', () => {
      const oldModel = new Model();
      controller.model = oldModel;
      expect(controller.model).toBe(oldModel);
      const model = new Model();
      jest.spyOn(model, 'addEventListener');
      jest.spyOn(oldModel, 'removeEventListener');
      controller.model = model;
      expect(model.addEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
      expect(oldModel.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
      expect(controller.model).toBe(model);
    });

    it('removes an existing model', () => {
      const model = new Model();
      controller.model = model;
      expect(controller.model).toBe(model);
      jest.spyOn(model, 'removeEventListener');
      controller.model = undefined;
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
      expect(controller.model).toBeUndefined();
    });
  });

  describe('onModelChange', () => {
    it('requests updating the component', async () => {
      controller.requestUpdate = jest.fn();
      await controller.onModelChange();
      expect(controller.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('routes', () => {
    const routes = {
      home: /^\/$/,
      about: /^\/about$/,
      user: /^\/user\/(?<name>[^/]+)$/,
    };

    it('subscribes to popstate events if routes are set in the controller', () => {
      jest.spyOn(globalThis, 'addEventListener');
      controller.routes = routes;
      controller.routes = routes;
      expect(globalThis.addEventListener).toHaveBeenCalledWith('popstate', controller.onPopstate);
      expect(globalThis.addEventListener.mock.calls.length).toBe(1);
      globalThis.addEventListener.mockRestore();
    });

    it('removes event listener for `popstate` event when routes are removed', () => {
      jest.spyOn(globalThis, 'removeEventListener');
      controller.routes = {};
      controller.routes = undefined;
      expect(globalThis.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        controller.onPopstate,
      );
      globalThis.removeEventListener.mockRestore();
    });

    it('emits `route` event if the url matches a route', () => {
      controller.routes = routes;
      const callback = jest.fn();
      controller.addEventListener('route', callback);
      globalThis.history.replaceState({}, '', '/about');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      controller.routes = routes;
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      globalThis.history.replaceState({}, '', '/user/arthur?a=b#c');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].detail).toMatchObject({
        route: 'user',
        params: {
          name: 'arthur',
        },
        query: new URLSearchParams('?a=b'),
        hash: '#c',
      });
    });

    it('handles custom roots while checking the url', () => {
      controller.rootPath = '/root';
      controller.routes = routes;
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      globalThis.history.replaceState({}, '', '/user/arthur?a=b#c');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).not.toHaveBeenCalled();
      globalThis.history.replaceState({}, '', '/root/user/arthur?a=b#c');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('onLanguageChange', () => {
    it('requests updating the component', async () => {
      controller.requestUpdate = jest.fn();
      await controller.onLanguageChange();
      expect(controller.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('translate', () => {
    it('translates a given message', () => {
      translator.setLanguage('en');
      expect(ControllerClass.translate('two')).toBe('two');
      translator.setLanguage('es');
      expect(ControllerClass.translate('two')).toBe('dos');
    });
  });

  describe('bond', () => {
    let input;
    let event;
    let part;

    beforeEach(() => {
      controller.model = new Model();
      input = document.createElement('input');
      input.setAttribute('type', 'text');
      event = { preventDefault: jest.fn() };
      part = {
        element: input,
        eventContext: controller,
        setValue: jest.fn((f) => (f ? f(event) : undefined)),
      };
    });

    it('handles one way binding between DOM elements and the model', () => {
      input.value = 'abc';
      ControllerClass.bond({ to: ':name' })(part);
      expect(controller.model.toJSON()).toEqual({ name: 'abc' });
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('binds to a nested attribute of the model if attribute name contains `.`', () => {
      controller.model = new Model();
      controller.model.name = {};
      input.value = 'abc';
      ControllerClass.bond({ to: ':name.first' })(part);
      expect(controller.model.toJSON()).toEqual({ name: { first: 'abc' } });
    });

    it('binds to a property of the controller', () => {
      input.value = 'abc';
      ControllerClass.bond({ to: 'name' })(part);
      expect(controller.name).toBe('abc');
    });

    it('prevents default action if `prevent:true`', () => {
      input.value = 'abc';
      ControllerClass.bond({ to: ':name', prevent: true })(part);
      expect(controller.model.toJSON()).toEqual({ name: 'abc' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      input.value = '12';
      ControllerClass.bond({ to: ':name', parse: parseInt })(part);
      expect(controller.model.toJSON()).toEqual({ name: 12 });
    });

    it('no-op if invalid binding configuration is provided', () => {
      input.value = '12';
      ControllerClass.bond({ to: '' })(part);
      expect(part.setValue).toHaveBeenCalledWith(undefined);
    });

    it('sets a value from a specified property', () => {
      ControllerClass.bond({ to: 'isDisabled', property: 'disabled' })(part);
      expect(controller.isDisabled).toBe(false);
    });

    it('sets a value from a specified attribute', () => {
      ControllerClass.bond({ to: 'inputType', attribute: 'type' })(part);
      expect(controller.inputType).toBe('text');
    });

    it('sets a constant value', () => {
      ControllerClass.bond({ to: 'name', value: 'abc' })(part);
      expect(controller.name).toBe('abc');
    });

    it('validates input before parsing if validation function is provided', () => {
      ControllerClass.bond({
        to: 'name',
        value: 'abc',
        validate: (element, content) => typeof content === 'string',
      })(part);
      expect(controller.name).toBe('abc');
    });

    it('does not set value if validation function is provided and returns a falsy value', () => {
      ControllerClass.bond({ to: 'name', value: 'abc', validate: () => false })(part);
      expect(controller.name).toBeUndefined();
    });
  });

  describe('navigate', () => {
    let event;
    let part;

    beforeEach(() => {
      event = {
        preventDefault: jest.fn(),
      };
      part = {
        element: {},
        setValue: jest.fn((f) => (f ? f(event) : undefined)),
      };
    });

    it('saves a URL into browser history', () => {
      const historyLength = globalThis.history.length;
      part.element.href = '/path';
      ControllerClass.navigate()(part);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength + 1);
      expect(globalThis.location.pathname).toBe('/path');
      ControllerClass.navigate('/anotherpath')(part);
      expect(globalThis.history.length).toBe(historyLength + 2);
      expect(globalThis.location.pathname).toBe('/anotherpath');
    });

    it('does not save if no URL is found', () => {
      const historyLength = globalThis.history.length;
      ControllerClass.navigate()(part);
      expect(part.setValue).toHaveBeenCalledWith(undefined);
      expect(globalThis.history.length).toBe(historyLength);
    });

    it('triggers popstate event', () => {
      const callback = jest.fn();
      globalThis.addEventListener('popstate', callback);
      ControllerClass.navigate('/path')(part);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('ts', () => {
    it('translates a given message', () => {
      translator.setLanguage('es');
      const part = { setValue: jest.fn() };
      ControllerClass.ts(ControllerClass, 'two')(part);
      expect(part.setValue).toHaveBeenCalledWith('dos');
    });
  });
});
