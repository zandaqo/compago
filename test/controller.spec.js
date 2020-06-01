import { jest } from '@jest/globals';
import { Controller, Translator } from '../index.js';

class Model extends EventTarget {}
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
      controller.model = {};
      input = document.createElement('input');
      input.setAttribute('id', 'name');
      event = { type: 'input', target: input, preventDefault: jest.fn() };
    });

    it('handles one way binding between DOM elements and the model', () => {
      input.value = 'abc';
      input.binding = { property: ':name' };
      controller.bond(event);
      expect(controller.model).toEqual({ name: 'abc' });
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('binds to a nested attribute of the model if attribute name contains `.`', () => {
      controller.model = { name: {} };
      input.value = 'abc';
      input.binding = { property: ':name.first' };
      controller.bond(event);
      expect(controller.model).toEqual({ name: { first: 'abc' } });
    });

    it('binds to attributes of the controller', () => {
      input.value = 'abc';
      input.binding = { property: 'data-name' };
      controller.bond(event);
      expect(controller.getAttribute('data-name')).toBe('abc');
    });

    it('prevents default action if `prevent:true`', () => {
      input.value = 'abc';
      input.binding = { property: ':name', prevent: true };
      controller.bond(event);
      expect(controller.model).toEqual({ name: 'abc' });
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('parses value if parsing function is provided as `parse` option', () => {
      input.value = '12';
      input.binding = { property: ':name', parse: parseInt };
      controller.bond(event);
      expect(controller.model).toEqual({ name: 12 });
    });

    it('throws a TypeError if no binding configuration is provided', () => {
      expect(() => {
        input.value = '12';
        input.binding = undefined;
        controller.bond(event);
      }).toThrow('No binding configuration found.');
    });
  });

  describe('navigate', () => {
    let navigationEvent;

    beforeEach(() => {
      navigationEvent = {
        target: undefined,
        preventDefault: jest.fn(),
      };
      controller.connectedCallback();
    });

    it('saves a URL into browser history', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.target = { href: '/path' };
      Controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength + 1);
      Controller.navigate(navigationEvent);
      expect(globalThis.history.length).toBe(historyLength + 2);
    });

    it('does not save if no URL is found', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.target = {
        getAttribute() {},
      };
      Controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).not.toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength);
    });

    it('triggers popstate event', () => {
      const callback = jest.fn();
      globalThis.addEventListener('popstate', callback);
      navigationEvent.target = { href: '/path' };
      Controller.navigate(navigationEvent);
      expect(callback).not.toHaveBeenCalled();
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

  describe('connectedCallback', () => {
    it('subscribes to model events if model is present', () => {
      const model = new Model();
      controller.model = model;
      jest.spyOn(model, 'addEventListener');
      controller.connectedCallback();
      expect(model.addEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
    });

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

  describe('translate', () => {
    it('translates a given key using the global translator', () => {
      jest.spyOn(translator, 'translate');
      ControllerClass.translate('key', { a: 1 });
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
