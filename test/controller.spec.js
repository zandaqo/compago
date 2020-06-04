import { jest } from '@jest/globals';
import { Controller, Translator } from '../index.js';

class Model extends EventTarget {
  toJSON() {
    return { ...this };
  }
}
class ControllerClass extends Controller {}
ControllerClass.translations = { en: {}, es: {} };
globalThis.customElements.define('c-controller', ControllerClass);

const translator = Translator.initialize({ languages: ['en', 'es'] });

describe('Controller', () => {
  let controller;
  beforeEach(() => {
    controller = document.createElement('c-controller');
  });

  describe('bond', () => {
    let input;
    let event;

    beforeEach(() => {
      controller.model = new Model();
      input = document.createElement('input');
      input.setAttribute('type', 'text');
      event = { type: 'input', currentTarget: input, preventDefault: jest.fn() };
    });

    it('handles one way binding between DOM elements and the model', () => {
      input.value = 'abc';
      input.binding = { to: ':name' };
      controller.bond(event);
      expect(controller.model.toJSON()).toEqual({ name: 'abc' });
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('binds to a nested attribute of the model if attribute name contains `.`', () => {
      controller.model = new Model();
      controller.model.name = {};
      input.value = 'abc';
      input.binding = { to: ':name.first' };
      controller.bond(event);
      expect(controller.model.toJSON()).toEqual({ name: { first: 'abc' } });
    });

    it('binds to a property of the controller', () => {
      input.value = 'abc';
      input.binding = { to: 'name' };
      controller.bond(event);
      expect(controller.name).toBe('abc');
    });

    it('prevents default action if `prevent:true`', () => {
      input.value = 'abc';
      input.binding = { to: ':name', prevent: true };
      controller.bond(event);
      expect(controller.model.toJSON()).toEqual({ name: 'abc' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      input.value = '12';
      input.binding = { to: ':name', parse: parseInt };
      controller.bond(event);
      expect(controller.model.toJSON()).toEqual({ name: 12 });
    });

    it('throws a TypeError if no binding configuration is provided', () => {
      expect(() => {
        input.value = '12';
        input.binding = undefined;
        controller.bond(event);
      }).toThrow('No binding configuration found.');
    });

    it('sets a value from a specified property', () => {
      input.binding = { to: 'isDisabled', property: 'disabled' };
      controller.bond(event);
      expect(controller.isDisabled).toBe(false);
    });

    it('sets a value from a specified attribute', () => {
      input.binding = { to: 'inputType', attribute: 'type' };
      controller.bond(event);
      expect(controller.inputType).toBe('text');
    });

    it('sets a constant value', () => {
      input.binding = { to: 'name', value: 'abc' };
      controller.bond(event);
      expect(controller.name).toBe('abc');
    });
  });

  describe('navigate', () => {
    let navigationEvent;

    beforeEach(() => {
      navigationEvent = {
        currentTarget: undefined,
        preventDefault: jest.fn(),
      };
      controller.connectedCallback();
    });

    it('saves a URL into browser history', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.currentTarget = { href: '/path' };
      controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength + 1);
      controller.navigate(navigationEvent);
      expect(globalThis.history.length).toBe(historyLength + 2);
    });

    it('does not save if no URL is found', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.currentTarget = {
        getAttribute() {},
      };
      controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).not.toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength);
    });

    it('triggers popstate event', () => {
      const callback = jest.fn();
      globalThis.addEventListener('popstate', callback);
      navigationEvent.currentTarget = { href: '/path' };
      controller.navigate(navigationEvent);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('onModelChange', () => {
    it('requests updating the component', async () => {
      controller.requestUpdate = jest.fn();
      await controller.onModelChange();
      expect(controller.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('onLanguageChange', () => {
    it('requests updating the component', async () => {
      controller.requestUpdate = jest.fn();
      await controller.onLanguageChange();
      expect(controller.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('removes an event listener from its model', () => {
      const model = new Model();
      controller.model = model;
      jest.spyOn(model, 'removeEventListener');
      controller.connectedCallback();
      controller.dispose();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
    });

    it('removes an event listener from the global translator', () => {
      jest.spyOn(translator, 'removeEventListener');
      controller.dispose();
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
    it('disposes of the controller upon disconnecting from the DOM', () => {
      controller.dispose = jest.fn();
      controller.disconnectedCallback();
      expect(controller.dispose).toHaveBeenCalled();
    });
  });

  describe('interpret', () => {
    it('translates a given key using the global translator', () => {
      jest.spyOn(translator, 'translate');
      controller.interpret('key', { a: 1 });
      expect(translator.translate).toHaveBeenCalledWith(
        ControllerClass.translations,
        'key',
        {
          a: 1,
        },
        'ControllerClass',
      );
      translator.translate.mockRestore();
    });
  });
});
