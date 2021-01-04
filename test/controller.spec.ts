import { Controller } from '../src/controller';
import { Observable } from '../src/observable';
import { Translator } from '../src/translator';

class ControllerClass extends Controller {}
ControllerClass.translations = { en: { two: 'two' }, es: { two: 'dos' } };
globalThis.customElements.define('c-controller', ControllerClass);
declare global {
  interface HTMLElementTagNameMap {
    'c-controller': ControllerClass;
  }
}

const translator = Translator.initialize({
  languages: ['en', 'es'],
  translations: { en: {}, es: {} },
});

describe('Controller', () => {
  let controller: ControllerClass;
  beforeEach(() => {
    controller = document.createElement('c-controller');
  });

  describe('connectedCallback', () => {
    it('subscribes to model events if model is present', () => {});

    it('subscribes to language change event if global translator is set', () => {
      jest.spyOn(translator, 'addEventListener');
      controller.connectedCallback();
      expect(translator.addEventListener).toHaveBeenCalledWith(
        'language-change',
        controller.onLanguageChange,
      );
      (translator.addEventListener as jest.Mock).mockRestore();
    });
  });

  describe('disconnectedCallback', () => {
    it('removes its model', () => {
      const model = new Observable({});
      controller.model = model;
      jest.spyOn(model, 'removeEventListener');
      controller.connectedCallback();
      controller.disconnectedCallback();
      expect(model.removeEventListener).toHaveBeenCalledWith(
        'change',
        controller.onModelChange,
      );
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
        'language-change',
        controller.onLanguageChange,
      );
      (translator.removeEventListener as jest.Mock).mockRestore();
    });
  });

  describe('model', () => {
    it('sets a model', () => {
      const model = new Observable<{ a: number }>({ a: 2 });
      jest.spyOn(model, 'addEventListener');
      expect(controller.model).toBeUndefined();
      controller.model = model;
      controller.model.a = 1;
      expect((model.addEventListener as jest.Mock).mock.calls.length).toBe(1);
      expect(model.addEventListener).toHaveBeenCalledWith(
        'change',
        controller.onModelChange,
      );
      expect(controller.model).toBe(model);
    });

    it('replaces an existing model', () => {
      const oldModel = new Observable({});
      controller.model = oldModel;
      expect(controller.model).toBe(oldModel);
      const model = new Observable({});
      jest.spyOn(model, 'addEventListener');
      jest.spyOn(oldModel, 'removeEventListener');
      controller.model = model;
      expect(model.addEventListener).toHaveBeenCalledWith(
        'change',
        controller.onModelChange,
      );
      expect(oldModel.removeEventListener).toHaveBeenCalledWith(
        'change',
        controller.onModelChange,
      );
      expect(controller.model).toBe(model);
    });

    it('removes an existing model', () => {
      const model = new Observable({});
      controller.model = model;
      expect(controller.model).toBe(model);
      jest.spyOn(model, 'removeEventListener');
      controller.model = undefined;
      expect(model.removeEventListener).toHaveBeenCalledWith(
        'change',
        controller.onModelChange,
      );
      expect(controller.model).toBeUndefined();
    });

    it('does not attach the same model twice', () => {
      const model = new Observable({});
      jest.spyOn(model, 'addEventListener');
      controller.model = model;
      controller.model = model;
      expect((model.addEventListener as jest.Mock).mock.calls.length).toBe(1);
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
      expect(globalThis.addEventListener).toHaveBeenCalledWith(
        'popstate',
        controller.onPopstate,
      );
      expect((globalThis.addEventListener as jest.Mock).mock.calls.length).toBe(1);
      (globalThis.addEventListener as jest.Mock).mockRestore();
    });

    it('removes event listener for `popstate` event when routes are removed', () => {
      jest.spyOn(globalThis, 'removeEventListener');
      controller.routes = {};
      controller.routes = undefined;
      expect(globalThis.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        controller.onPopstate,
      );
      (globalThis.removeEventListener as jest.Mock).mockRestore();
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
      controller.addEventListener('route', callback);
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
      controller.addEventListener('route', callback);
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
});
