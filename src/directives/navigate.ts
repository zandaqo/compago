import { directive, EventPart } from 'lit-html';

export const navigate = directive(
  (href?: string, state: any = {}) => (part: EventPart) => {
    const path = href || (part.element as any).href;
    part.setValue(
      path
        ? (event) => {
            event.preventDefault();
            globalThis.history.pushState(
              state,
              globalThis.document.title,
              path,
            );
            globalThis.dispatchEvent(new PopStateEvent('popstate', { state }));
          }
        : undefined,
    );
  },
);
