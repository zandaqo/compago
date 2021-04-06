import { directive, NodePart } from 'lit-html';

type TranslatableComponent = {
  translate(key: string, interpolation: any): string;
};

export const translate = directive(
  (ctor: TranslatableComponent, key: string, interpolation?: any) => (
    part: NodePart,
  ) => {
    part.setValue(ctor.translate(key, interpolation));
  },
);
