import { directive, NodePart } from 'lit-html';

type TranslatableController = {
  translate(key: string, interpolation: any): string;
};

export const translate = directive(
  (ctor: TranslatableController, key: string, interpolation?: any) => (
    part: NodePart,
  ) => {
    part.setValue(ctor.translate(key, interpolation));
  },
);
