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
    it('removes an event listener from its model', () => {
      const model = new Model();
      controller.model = model;
      jest.spyOn(model, 'removeEventListener');
      controller.connectedCallback();
      controller.disconnectedCallback();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
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

  describe('translate', () => {
    it('translates a given message', () => {
      translator.setLanguage('en');
      expect(ControllerClass.translate('two')).toBe('two');
      translator.setLanguage('es');
      expect(ControllerClass.translate('two')).toBe('dos');
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
