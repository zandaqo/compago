import { directive, EventPart } from 'lit-html';

type ComponentBond = {
  to: string;
  parse?: Function;
  validate?: (element: Element, content: any) => boolean;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: any;
};

export const bond = directive((binding: ComponentBond) => (part: EventPart) => {
  const { to, parse, prevent, property = 'value', attribute, value, validate } = binding;
  let path = to;
  let recipient = part.eventContext;
  if (path[0] === ':') {
    recipient = (recipient as any)!.model;
    path = path.slice(1);
  }
  if (path.includes('.')) {
    const chunks = path.split('.');
    path = chunks[chunks.length - 1];
    for (let i = 0; i < chunks.length - 1; i += 1) {
      recipient = (recipient as any)[chunks[i]];
    }
  }

  part.setValue(
    !recipient || !path
      ? undefined
      : (event) => {
          if (prevent) event.preventDefault();
          let content = Reflect.has(binding, 'value')
            ? value
            : attribute != null
            ? part.element.getAttribute(attribute)
            : (part.element as any)[property];
          if (typeof validate === 'function' && !validate(part.element, content)) return;
          if (typeof parse === 'function') content = parse(content);
          (recipient as any)[path] = content;
        },
  );
});
