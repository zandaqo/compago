import { ChangeEvent, Component } from '../src';
import { Observable } from '../src';
import { Translator } from '../src';

class ComponentClass extends Component<any> {}
ComponentClass.translations = { en: { two: 'two' }, es: { two: 'dos' } };
globalThis.customElements.define('c-component', ComponentClass);

declare global {
  interface HTMLElementTagNameMap {
    'c-component': ComponentClass;
  }
}

const translator = Translator.initialize({
  languages: ['en', 'es'],
  translations: { en: {}, es: {} },
});

describe('Component', () => {
  let component: ComponentClass;

  beforeEach(() => {
    component = document.createElement('c-component');
  });

  describe('connectedCallback', () => {
    it('subscribes to model events if model is present', () => {});

    it('subscribes to language change event if global translator is set', () => {
      jest.spyOn(translator, 'addEventListener');
      component.connectedCallback();
      expect(translator.addEventListener).toHaveBeenCalledWith(
        'language-change',
        component.onLanguageChange,
      );
      (translator.addEventListener as jest.Mock).mockRestore();
    });
  });

  describe('disconnectedCallback', () => {
    it('removes its model', () => {
      const model = new Observable({});
      component.model = model;
      jest.spyOn(model, 'removeEventListener');
      component.connectedCallback();
      component.disconnectedCallback();
      expect(model.removeEventListener).toHaveBeenCalledWith(
        'change',
        component.onModelChange,
      );
    });

    it('removes its routes', () => {
      component.routes = {};
      expect(component.routes).toBeDefined();
      component.disconnectedCallback();
      expect(component.routes).toBeUndefined();
    });

    it('removes an event listener from the global translator', () => {
      jest.spyOn(translator, 'removeEventListener');
      component.disconnectedCallback();
      expect(translator.removeEventListener).toHaveBeenCalledWith(
        'language-change',
        component.onLanguageChange,
      );
      (translator.removeEventListener as jest.Mock).mockRestore();
    });
  });

  describe('model', () => {
    it('sets a model', () => {
      const model = new Observable<{ a: number }>({ a: 2 });
      jest.spyOn(model, 'addEventListener');
      expect(component.model).toBeUndefined();
      component.model = model;
      component.model.a = 1;
      expect((model.addEventListener as jest.Mock).mock.calls.length).toBe(1);
      expect(model.addEventListener).toHaveBeenCalledWith(
        'change',
        component.onModelChange,
      );
      expect(component.model).toBe(model);
    });

    it('replaces an existing model', () => {
      const oldModel = new Observable({});
      component.model = oldModel;
      expect(component.model).toBe(oldModel);
      const model = new Observable({});
      jest.spyOn(model, 'addEventListener');
      jest.spyOn(oldModel, 'removeEventListener');
      component.model = model;
      expect(model.addEventListener).toHaveBeenCalledWith(
        'change',
        component.onModelChange,
      );
      expect(oldModel.removeEventListener).toHaveBeenCalledWith(
        'change',
        component.onModelChange,
      );
      expect(component.model).toBe(model);
    });

    it('removes an existing model', () => {
      const model = new Observable({});
      component.model = model;
      expect(component.model).toBe(model);
      jest.spyOn(model, 'removeEventListener');
      component.model = undefined;
      expect(model.removeEventListener).toHaveBeenCalledWith(
        'change',
        component.onModelChange,
      );
      expect(component.model).toBeUndefined();
    });

    it('does not attach the same model twice', () => {
      const model = new Observable({});
      jest.spyOn(model, 'addEventListener');
      component.model = model;
      component.model = model;
      expect((model.addEventListener as jest.Mock).mock.calls.length).toBe(1);
    });
  });

  describe('onModelChange', () => {
    it('requests updating the component', async () => {
      component.requestUpdate = jest.fn();
      await component.onModelChange({} as ChangeEvent);
      expect(component.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('routes', () => {
    const routes = {
      home: /^\/$/,
      about: /^\/about$/,
      user: /^\/user\/(?<name>[^/]+)$/,
    };

    it('subscribes to popstate events if routes are set in the component', () => {
      jest.spyOn(globalThis, 'addEventListener');
      component.routes = routes;
      component.routes = routes;
      expect(globalThis.addEventListener).toHaveBeenCalledWith(
        'popstate',
        component.onPopstate,
      );
      expect((globalThis.addEventListener as jest.Mock).mock.calls.length).toBe(
        1,
      );
      (globalThis.addEventListener as jest.Mock).mockRestore();
    });

    it('removes event listener for `popstate` event when routes are removed', () => {
      jest.spyOn(globalThis, 'removeEventListener');
      component.routes = {};
      component.routes = undefined;
      expect(globalThis.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        component.onPopstate,
      );
      (globalThis.removeEventListener as jest.Mock).mockRestore();
    });

    it('emits `route` event if the url matches a route', () => {
      component.routes = routes;
      const callback = jest.fn();
      component.addEventListener('route', callback);
      globalThis.history.replaceState({}, '', '/about');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(callback).toHaveBeenCalled();
    });

    it('sends route parameters with the `route` event', () => {
      component.routes = routes;
      const callback = jest.fn();
      const state = { a: 1 };
      component.addEventListener('route', callback);
      globalThis.history.replaceState(state, '', '/user/arthur?a=b#c');
      globalThis.dispatchEvent(new PopStateEvent('popstate', { state }));
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].detail).toMatchObject({
        route: 'user',
        params: {
          name: 'arthur',
        },
        query: new URLSearchParams('?a=b'),
        hash: '#c',
        state,
      });
    });

    it('handles custom roots while checking the url', () => {
      component.rootPath = '/root';
      component.routes = routes;
      const callback = jest.fn();
      component.addEventListener('route', callback);
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
      component.requestUpdate = jest.fn();
      await component.onLanguageChange();
      expect(component.requestUpdate).toHaveBeenCalled();
    });
  });

  describe('translate', () => {
    it('translates a given message', () => {
      translator.setLanguage('en');
      expect(ComponentClass.translate('two')).toBe('two');
      translator.setLanguage('es');
      expect(ComponentClass.translate('two')).toBe('dos');
    });
  });
});
