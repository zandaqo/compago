import { NodePart, RenderOptions } from 'lit-html';
import { translate } from '../../src/directives/translate';
import { Controller } from '../../src/controller';

describe('translate', () => {
  it('calls a translator', () => {
    class C extends Controller {}
    C.translate = jest.fn();
    const interpolation = {};
    translate(C, 'apple', interpolation)(new NodePart({} as RenderOptions));
    expect(C.translate).toHaveBeenCalledWith('apple', interpolation);
  });
});
