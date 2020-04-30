// fixing EventTarget constructor support in jsdom
Object.defineProperty(window.EventTarget.prototype, '_document', {
  value: window.document,
  writable: true,
});
