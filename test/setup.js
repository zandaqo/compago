// fixing EventTarget constructor support in jsdom
Object.defineProperty(window.EventTarget.prototype, '_document', {
  value: window.document,
  writable: true,
});

// a workaround for missing Element#closest support in jsdom
Object.defineProperty(window.Element.prototype, 'closest', {
  value(selector) {
    let el = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  },
  writable: true,
});

Object.defineProperty(window, 'HTMLElement', { value: class extends EventTarget {} });
