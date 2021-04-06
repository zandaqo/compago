import { EventPart } from 'lit-html';
import { bond } from '../../src/directives/bond';
import { Component } from '../../src/component';
import { Observable } from '../../src/observable';

class ComponentClass extends Component {}
globalThis.customElements.define('c-b-component', ComponentClass);

describe('bond', () => {
  let component: ComponentClass;
  let input: HTMLInputElement;
  let event: Partial<Event>;
  let part: EventPart;

  beforeEach(() => {
    component = document.createElement('c-b-component') as ComponentClass;
    component.model = new Observable({});
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    event = { preventDefault: jest.fn() };
    part = new EventPart(input, 'input', component);
    part.setValue = jest.fn((f: (event: any) => {}) => (f ? f(event) : undefined));
  });

  it('handles one way binding between DOM elements and the model', () => {
    input.value = 'abc';
    bond({ to: ':name' })(part);
    expect(component.model!.toJSON()).toEqual({ name: 'abc' });
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('handles one way binding between DOM elements and the model', () => {
    input.value = 'abc';
    bond({ to: ':name' })(part);
    expect(component.model!.toJSON()).toEqual({ name: 'abc' });
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('binds to a nested attribute of the model if attribute name contains `.`', () => {
    component.model = new Observable({});
    (component.model as any).name = {};
    input.value = 'abc';
    bond({ to: ':name.first' })(part);
    expect(component.model.toJSON()).toEqual({ name: { first: 'abc' } });
  });

  it('binds to a property of the component', () => {
    input.value = 'abc';
    bond({ to: 'name' })(part);
    expect((component as any).name).toBe('abc');
  });

  it('prevents default action if `prevent:true`', () => {
    input.value = 'abc';
    bond({ to: ':name', prevent: true })(part);
    expect(component.model!.toJSON()).toEqual({ name: 'abc' });
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('parses value if parsing function is provided as `parse` option', () => {
    input.value = '12';
    bond({ to: ':name', parse: parseInt })(part);
    expect(component.model!.toJSON()).toEqual({ name: 12 });
  });

  it('no-op if invalid binding configuration is provided', () => {
    input.value = '12';
    bond({ to: '' })(part);
    expect(part.setValue).toHaveBeenCalledWith(undefined);
  });

  it('sets a value from a specified property', () => {
    bond({ to: 'isDisabled', property: 'disabled' })(part);
    expect((component as any).isDisabled).toBe(false);
  });

  it('sets a value from a specified attribute', () => {
    bond({ to: 'inputType', attribute: 'type' })(part);
    expect((component as any).inputType).toBe('text');
  });

  it('sets a constant value', () => {
    bond({ to: 'name', value: 'abc' })(part);
    expect((component as any).name).toBe('abc');
  });

  it('validates input before parsing if validation function is provided', () => {
    bond({
      to: 'name',
      value: 'abc',
      validate: (_, content) => typeof content === 'string',
    })(part);
    expect((component as any).name).toBe('abc');
  });

  it('does not set value if validation function is provided and returns a falsy value', () => {
    bond({ to: 'name', value: 'abc', validate: () => false })(part);
    expect((component as any).name).toBeUndefined();
  });
});
