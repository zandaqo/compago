import { directive, EventPart } from 'lit-html';

export const navigate = directive((href: string) => (part: EventPart) => {
  const path = href || (part.element as any).href;
  part.setValue(
    path
      ? (event) => {
          event.preventDefault();
          globalThis.history.pushState({}, globalThis.document.title, path);
          globalThis.dispatchEvent(new PopStateEvent('popstate'));
        }
      : undefined,
  );
});
