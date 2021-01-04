import { directive, NodePart } from 'lit-html';
import { Controller } from '../controller';

export const translate = directive(
  (ctor: typeof Controller, key: string, interpolation?: any) => (part: NodePart) => {
    part.setValue(ctor.translate(key, interpolation));
  },
);
