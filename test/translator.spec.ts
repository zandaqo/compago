import { Translator } from '../src';
import { jest } from '@jest/globals';

describe('Translator', () => {
  describe('constructor', () => {
    it('creates an instance of translator with given options', () => {
      const translator = new Translator({
        language: 'en',
        languages: ['en', 'es'],
        translations: {
          en: { $save: 'Save' },
          es: { $save: 'Guardar' },
        },
      });
      expect(translator instanceof Translator).toBe(true);
      expect(translator.language).toBe('en');
      expect(translator.pluralRules instanceof Intl.PluralRules).toBe(true);
      expect(translator.pluralRules.resolvedOptions()).toEqual(
        new Intl.PluralRules('en').resolvedOptions(),
      );
      expect(translator.globalPrefix).toBe('$');
    });

    it('detects language upon creation if not provided', () => {
      const translator = new Translator({
        languages: ['ce', 'en'],
        translations: {},
      });
      expect(translator instanceof Translator).toBe(true);
      expect(translator.language).toBe('en');
    });
  });

  describe('setLanguage', () => {
    it('changes the current language to a given language', () => {
      const translator = new Translator({
        languages: ['en'],
        translations: {},
      });
      translator.setLanguage('de-DE');
      expect(translator.language).toBe('de-DE');
      expect(translator.pluralRules).toEqual(new Intl.PluralRules('de-DE'));
    });

    it('emits `language-change` event if language has changed', () => {
      const translator = new Translator({
        languages: ['en', 'en-GB'],
        translations: {},
      });
      translator.dispatchEvent = jest.fn();
      translator.setLanguage('en');
      expect(translator.dispatchEvent).not.toHaveBeenCalled();
      translator.setLanguage('en-GB');
      expect(translator.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('getLanguage', () => {
    it('gets a language matching a given one from the list of supported languages', () => {
      const translator = new Translator({
        languages: ['en', 'de', 'en-GB'],
        translations: {},
      });
      expect(translator.getLanguage('de-DE')).toBe('de');
      expect(translator.getLanguage('en-US')).toBe('en');
      expect(translator.getLanguage('en-GB')).toBe('en-GB');
    });

    it('returns the first supported language if no match is found', () => {
      const translator = new Translator({
        languages: ['en', 'de', 'en-GB'],
        translations: {},
      });
      expect(translator.getLanguage('zh')).toBe('en');
    });

    it('uses user language if no language provided', () => {
      const translator = new Translator({
        languages: ['de', 'en'],
        translations: {},
      });
      expect(translator.getLanguage()).toBe('en');
    });
  });

  describe('translate', () => {
    const translator = new Translator({
      language: 'en',
      languages: ['en', 'es', 'de'],
      translations: {
        en: { $save: 'Save' },
        es: { $save: 'Guardar' },
      },
    });
    const translations = {
      en: {
        open: 'Open',
        hello: 'Hello, {{name}}!',
        lemons: {
          one: 'One lemon',
          other: '{{count}} lemons',
        },
        apples: {
          one: 'One apple',
        },
        date: new Intl.DateTimeFormat('en', { year: 'numeric', era: 'narrow' }),
        amount: new Intl.NumberFormat('en'),
        ago: new Intl.RelativeTimeFormat('en', { style: 'narrow' }),
      },
      es: {
        open: 'Abrir',
        hello: 'Hola, {{name}}!',
        lemons: {
          one: 'Un limón',
          other: '{{count}} limónes',
        },
        apples: {
          one: 'Una manzana',
        },
        date: new Intl.DateTimeFormat('es', { year: '2-digit', era: 'long' }),
        amount: new Intl.NumberFormat('es'),
        ago: new Intl.RelativeTimeFormat('es', { style: 'narrow' }),
      },
    };

    beforeEach(() => {
      translator.setLanguage('en');
    });

    it('translates a given message using a local translation', () => {
      expect(translator.translate(translations, 'open')).toBe('Open');
      translator.setLanguage('es');
      expect(translator.translate(translations, 'open')).toBe('Abrir');
    });

    it('translates using a global translation', () => {
      expect(translator.translate(translations, '$save')).toBe('Save');
      translator.setLanguage('es');
      expect(translator.translate(translations, '$save')).toBe('Guardar');
    });

    it('uses interpolation', () => {
      expect(translator.translate(translations, 'hello', { name: 'a' })).toBe(
        'Hello, a!',
      );
      translator.setLanguage('es');
      expect(translator.translate(translations, 'hello', { name: 'a' })).toBe(
        'Hola, a!',
      );
    });

    it('handles plurals', () => {
      expect(translator.translate(translations, 'lemons', { count: 0 })).toBe(
        '0 lemons',
      );
      expect(translator.translate(translations, 'lemons', { count: 1 })).toBe(
        'One lemon',
      );
      expect(translator.translate(translations, 'lemons', { count: 10 })).toBe(
        '10 lemons',
      );
      translator.setLanguage('es');
      expect(translator.translate(translations, 'lemons', { count: 0 })).toBe(
        '0 limónes',
      );
      expect(translator.translate(translations, 'lemons', { count: 1 })).toBe(
        'Un limón',
      );
      expect(translator.translate(translations, 'lemons', { count: 10 })).toBe(
        '10 limónes',
      );
    });

    it('reports if translation is missing for a plural rule', () => {
      jest.spyOn(translator, 'reportMissing');
      expect(translator.translate(translations, 'apples', { count: 10 })).toBe(
        '',
      );
      expect(translator.reportMissing).toHaveBeenCalledWith(
        undefined,
        'apples',
        'other',
      );
      (translator.reportMissing as jest.Mock).mockRestore();
    });

    it('returns empty string if the message is not found', () => {
      expect(translator.translate(translations, 'abc')).toBe('');
    });

    it('calls report if the translation is missing', () => {
      const cb = jest.fn();
      translator.addEventListener('missing-translation', cb);
      translator.translate(translations, 'abc', undefined, 'ABC');
      expect((cb.mock.calls[0][0] as any).detail).toEqual({
        component: 'ABC',
        key: 'abc',
        rule: undefined,
      });
      translator.removeEventListener('missing-translation', cb);
    });

    it('formats dates', () => {
      expect(translator.translate(translations, 'date', new Date(0))).toBe(
        '1970 A',
      );
      translator.setLanguage('es');
      expect(translator.translate(translations, 'date', new Date(0))).toBe(
        '70 después de Cristo',
      );
    });

    it('formats numbers', () => {
      expect(translator.translate(translations, 'amount', 1000000.999)).toBe(
        '1,000,000.999',
      );
      translator.setLanguage('es');
      expect(translator.translate(translations, 'amount', 1000000.999)).toBe(
        '1.000.000,999',
      );
    });

    it('formats relative time', () => {
      expect(translator.translate(translations, 'ago', [2, 'day'])).toBe(
        'in 2 days',
      );
      translator.setLanguage('es');
      expect(translator.translate(translations, 'ago', [2, 'day'])).toBe(
        'dentro de 2 días',
      );
    });
  });

  describe('reportMissing', () => {});

  describe('initialize', () => {
    it('creates and sets up a global translator', () => {
      const translator = Translator.initialize({
        languages: ['en'],
        translations: {},
      });
      expect((globalThis as any)[Symbol.for('c-translator')]).toBe(translator);
    });
  });

  describe('interpolate', () => {
    it('interpolates', () => {
      expect(Translator.interpolate('a {{b}} c', { b: 'b' })).toBe('a b c');
      expect(Translator.interpolate('a {{b}} c', {})).toBe('a  c');
    });
  });
});
