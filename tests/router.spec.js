import Router from '../src/router';

describe('Router', () => {
  let r;
  beforeEach(() => {
    r = new Router();
  });

  describe('constructor', () => {
    it('constructs a router', () => {
      expect(r.routes).toEqual([]);
      expect(r.started).toBe(false);
    });

    it('adds specified routes upon construction', () => {
      const nr = new Router({ routes: { home: '/', user: '/user/:id' } });
      expect(nr.routes.length).toBe(2);
      expect(nr.routes[0].route).toBe('home');
      expect(nr.routes[1].route).toBe('user');
    });

    it('accepts custom root', () => {
      const nr = new Router({ root: '/subdomain/' });
      expect(nr.root).toBe('/subdomain');
    });
  });

  describe('addRoute', () => {
    it('adds a route to the collection of routes', () => {
      r.addRoute('root', '/');
      expect(r.routes.length).toBe(1);
      expect(r.routes[0].route).toBe('root');
      expect(r.routes[0] instanceof RegExp).toBe(true);
      r.addRoute('somewhere', '/somewhere');
      expect(r.routes.length).toBe(2);
      expect(r.routes[1].route).toBe('somewhere');
      expect(r.routes[1] instanceof RegExp).toBe(true);
    });
  });

  describe('removeRoute', () => {
    it('removes a route from the collection of routes', () => {
      r.addRoute('root', '/');
      r.addRoute('somewhere', '/somewhere');

      expect(r.routes.length).toBe(2);
      r.removeRoute('root');
      expect(r.routes.length).toBe(1);
      expect(r.routes[0].route).toBe('somewhere');
      expect(r.routes[0] instanceof RegExp).toBe(true);

      r.removeRoute('nonexistentroute');
      expect(r.routes.length).toBe(1);

      r.removeRoute('somewhere');
      expect(r.routes.length).toBe(0);
      r.removeRoute('somewhere');
    });
  });

  describe('start', () => {
    let spyAddEvent;

    beforeEach(() => {
      spyAddEvent = jest.spyOn(window, 'addEventListener');
      r.history = {};
      r.history.pushState = jest.fn();
    });

    afterEach(() => {
      r.history.pushState = undefined;
      spyAddEvent.mockRestore();
    });

    it('enables the router to handle hash changes', () => {
      r._checkUrl = jest.fn();
      expect(r.started).toBe(false);
      r.start();
      expect(r.started).toBe(true);
      expect(r._checkUrl).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', r._onPopstateEvent);
    });

    it('return if router is already started', () => {
      r.start();
      r.start();
      expect(window.addEventListener.mock.calls.length).toBe(1);
    });

    it('does not load ULR if `silent:true`', () => {
      r._checkUrl = jest.fn();
      r.start({ silent: true });
      expect(r._checkUrl).not.toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', r._onPopstateEvent);
    });

    it('throws error if the browser does not support History API', () => {
      r.history.pushState = undefined;
      expect(() => r.start()).toThrow('The browser does not support History API.');
    });
  });

  describe('stop', () => {
    it('disables the router', () => {
      const tempAddEvent = window.addEventListener;
      window.removeEventListener = jest.fn();
      r.stop();
      expect(r.started).toBe(false);
      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', r._onPopstateEvent);
      window.removeEventListener = tempAddEvent;
    });
  });

  describe('navigate', () => {
    beforeEach(() => {
      r.fragment = '/files';
      r.started = true;
      r._checkUrl = jest.fn();
      r.history = {};
      r.history.pushState = jest.fn();
      r.history.replaceState = jest.fn();
      r.root = '/system';
    });

    it('adds a fragment into the browser history', () => {
      r.navigate('/folders');
      expect(r.history.pushState.mock.calls.length).toBe(1);
      expect(r.history.pushState.mock.calls[0]).toContain('/system/folders');
    });

    it('changes the current fragment in the history if `replace:true`', () => {
      r.navigate('/folders', { replace: true });
      expect(r.history.replaceState.mock.calls.length).toBe(1);
      expect(r.history.replaceState.mock.calls[0]).toContain('/system/folders');
    });

    it('checks the fragment and fires `route` events unless `silent:true`', () => {
      r.navigate('/folders');
      expect(r._checkUrl.mock.calls.length).toBe(1);
      expect(r._checkUrl.mock.calls[0]).toEqual(['/folders']);
    });

    it('does not check the fragment if `silent:true`', () => {
      r.navigate('/folders', { silent: true });
      expect(r._checkUrl).not.toHaveBeenCalled();
    });

    it('does not load if a fragment has not been changed', () => {
      r.fragment = '/folders';
      const result = r.navigate('/folders');
      expect(result).toBe(false);
      expect(r.history.pushState).not.toHaveBeenCalled();
      expect(r.history.replaceState).not.toHaveBeenCalled();
      expect(r._checkUrl).not.toHaveBeenCalled();
    });

    it('returns if the router is disabled', () => {
      r.started = false;
      const result = r.navigate('/folders');
      expect(result).toBe(false);
      expect(r.history.pushState).not.toHaveBeenCalled();
      expect(r.history.replaceState).not.toHaveBeenCalled();
      expect(r._checkUrl).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    let spyRemoveEvent;

    beforeEach(() => {
      spyRemoveEvent = jest.spyOn(window, 'removeEventListener');
      r.started = true;
      r.someMethod = jest.fn();
      window.removeEventListener = jest.fn();
    });

    afterEach(() => {
      spyRemoveEvent.mockRestore();
    });

    it('prepares the router to be disposed', () => {
      r.addRoute('path', '/path');
      expect(r.routes.length).toBe(1);
      r.dispose();
      expect(r.routes.length).toBe(0);
      expect(r.started).toBe(false);
    });

    it('fires `dispose` event unless `silent:true`', () => {
      r.on(r, 'dispose', r.someMethod);
      r.dispose();
      expect(r.someMethod).toHaveBeenCalled();
      expect(r._events).toBe(undefined);
      expect(r._listeners.size).toEqual(0);
      const otherMethod = jest.fn();
      r.on(r, 'dispose', otherMethod);
      r.dispose({ silent: true });
      expect(otherMethod).not.toHaveBeenCalled();
    });
  });

  describe('_getFragment', () => {
    it('gets an URL fragment from the current location', () => {
      r.location = {};
      r.location.pathname = '/files';
      r.location.search = '';
      r.location.hash = '';
      r.root = '/root';
      expect(r._getFragment()).toBe('/files');
      r.location.pathname = '/root/files';
      expect(r._getFragment()).toBe('/files');
      expect(r._getFragment('/files')).toBe('/files');
      r.location.hash = '#somefile';
      expect(r._getFragment()).toBe('/files#somefile');
    });
  });

  describe('_onPopstateEvent', () => {
    it('checks whether the URL fragment has been changed.', () => {
      r.location = {};
      r.location.pathname = '/files';
      r.location.search = '';
      r.location.hash = '';
      r.root = '/root/';
      r.fragment = '/folders';
      r._checkUrl = jest.fn();
      r._onPopstateEvent();
      expect(r._checkUrl).toHaveBeenCalled();
      r.fragment = '/files';
      r._checkUrl = jest.fn();
      r._onPopstateEvent();
      expect(r._checkUrl).not.toHaveBeenCalled();
    });
  });

  describe('_checkUrl', () => {
    it('emits `route` events if a matching route is found', () => {
      const eventNames = [];
      r.fileCallback = (event) => {
        eventNames.push(event.event);
      };
      const fileCallbackSpy = jest.spyOn(r, 'fileCallback');

      r.addRoute('file', '/files/:name');
      r.on(r, 'route:file', r.fileCallback);
      r.on(r, 'route', r.fileCallback);
      r._checkUrl('/files/index.txt?q=abc#anchor');
      expect(r.fileCallback.mock.calls.length).toBe(2);

      expect(fileCallbackSpy.mock.calls[0][0].emitter).toBe(r);
      expect(fileCallbackSpy.mock.calls[0][0].route).toEqual('file');
      expect(fileCallbackSpy.mock.calls[0][0].params).toEqual({ name: 'index.txt' });
      expect(fileCallbackSpy.mock.calls[0][0].query.q).toBe('abc');
      expect(fileCallbackSpy.mock.calls[0][0].hash).toEqual('anchor');

      expect(eventNames).toEqual(['route:file', 'route']);
      fileCallbackSpy.mockRestore();
    });

    it('does not emit if no matching route is found', () => {
      r.addRoute('file', '/files/:name');
      const emitSpy = jest.spyOn(r, 'emit');
      r._checkUrl('/docs/random');
      expect(r.emit).not.toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  describe('_extractParameters', () => {
    it('extracts an array of parameters from an URL fragment', () => {
      const _extractParameters = Router._extractParameters;
      r.addRoute('1', '/login');
      r.addRoute('2', '/user/:name');
      r.addRoute('3', '/f/:filename?');
      r.addRoute('4', '/f/:dir/:filename?');
      expect(_extractParameters(r.routes[0], '/login')).toEqual({});
      expect(_extractParameters(r.routes[1], '/user/Smith')).toEqual({ name: 'Smith' });
      expect(_extractParameters(r.routes[2], '/f/index.txt')).toEqual({ filename: 'index.txt' });
      expect(_extractParameters(r.routes[2], '/f')).toEqual({ filename: undefined });
      expect(_extractParameters(r.routes[3], '/f/folder/index.txt')).toEqual({
        dir: 'folder',
        filename: 'index.txt',
      });
      expect(_extractParameters(r.routes[3], '/f/folder')).toEqual({
        dir: 'folder',
        filename: undefined,
      });
    });
  });
});
