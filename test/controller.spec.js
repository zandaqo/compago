import { jest } from '@jest/globals';
import { Controller } from '../index.js';

class Model extends EventTarget {}
class ControllerClass extends Controller {}
globalThis.customElements.define('c-controller', ControllerClass);

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
      ControllerClass.routes = {
        home: /^\/$/,
        about: /^\/about$/,
        user: /^\/user\/(?<name>[^/]+)$/,
      };
      navigationEvent = {
        target: undefined,
        preventDefault: jest.fn(),
      };
      controller.connectedCallback();
    });

    it('saves a URL into browser history', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.target = { href: '/path' };
      controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength + 1);
      controller.navigate(navigationEvent);
      expect(globalThis.history.length).toBe(historyLength + 2);
    });

    it('does not save if no URL is found', () => {
      const historyLength = globalThis.history.length;
      navigationEvent.target = {
        getAttribute() {},
      };
      controller.navigate(navigationEvent);
      expect(navigationEvent.preventDefault).not.toHaveBeenCalled();
      expect(globalThis.history.length).toBe(historyLength);
    });

    it('emits `route` event if the url matches a route', () => {
      const callback = jest.fn();
      controller.addEventListener('route', callback);
      navigationEvent.target = { href: '/about' };
      controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      navigationEvent.target = { href: '/user/arthur?a=b#c' };
      controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
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

    it('handles custom roots while checking the url', () => {
      ControllerClass.root = '/root';
      const callback = jest.fn();
      controller.addEventListener('route', callback, { handler: true });
      navigationEvent.target = { href: '/user/arthur?a=b#c' };
      controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).not.toHaveBeenCalled();
      navigationEvent.target = { href: '/root/user/arthur?a=b#c' };
      controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
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

  describe('dispose', () => {
    it('removes event listeners from the model', () => {
      const model = new Model();
      controller.model = model;
      jest.spyOn(model, 'removeEventListener');
      controller.connectedCallback();
      controller.dispose();
      expect(model.removeEventListener).toHaveBeenCalledWith('change', controller.onModelChange);
    });

    it('removes event listener for `popstate` event', () => {
      jest.spyOn(globalThis, 'removeEventListener');
      ControllerClass.routes = {};
      controller.connectedCallback();
      controller.dispose();
      expect(globalThis.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        controller.onPopstate,
      );
      globalThis.removeEventListener.mockRestore();
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
    it('subscribes to popstate events if routes are present in the controller', () => {
      jest.spyOn(globalThis, 'addEventListener');
      ControllerClass.routes = {};
      controller.connectedCallback();
      expect(globalThis.addEventListener).toHaveBeenCalledWith('popstate', controller.onPopstate);
      globalThis.addEventListener.mockRestore();
    });
  });

  describe('disconnectedCallback', () => {
    it('disposes of the controller upon disconnecting from the DOM', () => {
      controller.dispose = jest.fn();
      controller.disconnectedCallback();
      expect(controller.dispose).toHaveBeenCalled();
    });
  });
});
