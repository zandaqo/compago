import { EventPart } from 'lit-html';
import { navigate } from '../../src/directives/navigate';

describe('navigate', () => {
  let element: HTMLElement;
  let part: EventPart;
  let event: Event;

  beforeEach(() => {
    element = globalThis.document.createElement('div');
    event = new Event('click');
    event.preventDefault = jest.fn();
    part = new EventPart(element, 'click', element);
    part.setValue = jest.fn((f: EventListener) => (f ? f(event) : undefined));
  });

  it('saves a URL into browser history', () => {
    const historyLength = globalThis.history.length;
    (part.element as any).href = '/path';
    navigate('')(part);
    expect((event as any).preventDefault).toHaveBeenCalled();
    expect(globalThis.history.length).toBe(historyLength + 1);
    expect(globalThis.location.pathname).toBe('/path');
    navigate('/anotherpath')(part);
    expect(globalThis.history.length).toBe(historyLength + 2);
    expect(globalThis.location.pathname).toBe('/anotherpath');
  });

  it('does not save if no URL is found', () => {
    const historyLength = globalThis.history.length;
    navigate('')(part);
    expect(part.setValue).toHaveBeenCalledWith(undefined);
    expect(globalThis.history.length).toBe(historyLength);
  });

  it('triggers popstate event', () => {
    const callback = jest.fn();
    globalThis.addEventListener('popstate', callback);
    navigate('/path')(part);
    expect(callback).toHaveBeenCalled();
  });
});
