import { jest } from '@jest/globals';
import { Controller } from '../index.js';

describe('Router', () => {
  let navigationEvent;
  let router;

  const routes = {
    home: /^\/$/,
    about: /^\/about$/,
    user: /^\/user\/(?<name>[^/]+)$/,
  };

  beforeEach(() => {
    router = document.createElement('compago-router');
    router.routes = routes;
    navigationEvent = {
      target: undefined,
      preventDefault: jest.fn(),
    };
    router.connectedCallback();
  });

  describe('connectedCallback', () => {
    it('subscribes to popstate events if routes are present in the controller', () => {
      jest.spyOn(globalThis, 'addEventListener');
      router.routes = {};
      router.connectedCallback();
      expect(globalThis.addEventListener).toHaveBeenCalledWith('popstate', router.onPopstate);
      globalThis.addEventListener.mockRestore();
    });
  });

  describe('disconnectedCallback', () => {
    it('removes event listener for `popstate` event', () => {
      jest.spyOn(globalThis, 'removeEventListener');
      router.routes = {};
      router.disconnectedCallback();
      expect(globalThis.removeEventListener).toHaveBeenCalledWith('popstate', router.onPopstate);
      globalThis.removeEventListener.mockRestore();
    });
  });

  describe('onPopstate', () => {
    it('emits `route` event if the url matches a route', () => {
      const callback = jest.fn();
      router.addEventListener('route', callback);
      navigationEvent.target = { href: '/about' };
      Controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      const callback = jest.fn();
      router.addEventListener('route', callback, { handler: true });
      navigationEvent.target = { href: '/user/arthur?a=b#c' };
      Controller.navigate(navigationEvent);
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
      router.root = '/root';
      const callback = jest.fn();
      router.addEventListener('route', callback, { handler: true });
      navigationEvent.target = { href: '/user/arthur?a=b#c' };
      Controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).not.toHaveBeenCalled();
      navigationEvent.target = { href: '/root/user/arthur?a=b#c' };
      Controller.navigate(navigationEvent);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });
  });
});
