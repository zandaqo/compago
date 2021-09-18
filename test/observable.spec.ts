import { Observable } from "../observable";
import { ChangeEvent, ChangeType } from "../change-event";
import { jest } from "@jest/globals";

interface IData {
  answer: number;
  question?: string;
  object?: { name: string; heads?: number };
  array?: Array<any>;
  re?: RegExp;
  anyMap?: Map<string, any>;
  anySet?: Set<any>;
}

class DataObservable extends Observable<IData> {}

describe("Observable", () => {
  let observable: DataObservable;
  let spy: jest.MockedFunction<any>;

  beforeEach(() => {
    observable = new DataObservable({
      answer: 42,
      question: "",
      object: { name: "Zaphod", heads: 1 },
      array: undefined,
    });
    spy = jest.fn();
  });

  describe("constructor", () => {
    it("creates an observable", () => {
      const m = new Observable({});
      expect(m instanceof Observable).toBe(true);
      expect(m.toJSON()).toEqual({});
    });
  });

  describe("reactivity", () => {
    it("emits a `change` event when properties are changed", () => {
      observable.addEventListener("change", spy);
      observable.answer = 1;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":answer", ChangeType.Set, 42),
        ],
      ]);
    });

    it("handles setters", () => {
      class ObservableSetters extends Observable<{
        answer?: number;
        _id?: number;
      }> {
        set setAnswer(value: number) {
          this.answer = value;
        }
      }

      const observableWithSetter = new ObservableSetters({
        answer: 42,
        _id: 10,
      });
      expect(observableWithSetter._id).toBe(10);
      observableWithSetter.addEventListener("change", spy);
      observableWithSetter.setAnswer = 45;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":answer", ChangeType.Set, 42),
        ],
      ]);
    });

    it("reacts to changes on nested objects", () => {
      observable.addEventListener("change", spy);
      observable.object!.name = "Ford";
      observable.assign({ array: [1] });
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":object:name", ChangeType.Set, "Zaphod"),
        ],
        [
          new ChangeEvent(":array", ChangeType.Set),
        ],
      ]);
    });

    it("reacts to changes on nested arrays", () => {
      observable.array = [0];
      observable.addEventListener("change", spy);
      observable.array[1] = 2;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":array:1", ChangeType.Set),
        ],
      ]);
    });

    it("handles cyclic self-references", () => {
      interface AB {
        a?: number;
        b?: number;
        c?: AB;
      }
      const ab: AB = { a: 1, b: 1 };
      const abObservable = new Observable<AB>(ab);
      expect(abObservable.a).toBe(1);
      abObservable.c = abObservable;
      abObservable.addEventListener("change", spy);
      abObservable.a = 2;
      abObservable.c!.a = 3;
      expect(abObservable.a).toBe(3);
      const { calls } = spy.mock;
      expect(calls).toEqual([
        [
          new ChangeEvent(":a", ChangeType.Set, 1),
        ],
        [
          new ChangeEvent(":a", ChangeType.Set, 2),
        ],
      ]);
    });

    it("handles moving objects within", () => {
      interface AB {
        a?: number;
        b?: number;
        c?: { d: number };
        d?: { d: number };
      }
      const abObservable = new Observable<AB>({});
      abObservable.c = { d: 1 };
      abObservable.d = abObservable.c;
      abObservable.addEventListener("change", spy);
      abObservable.c.d = 2;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":d:d", ChangeType.Set, 1),
        ],
      ]);
    });

    it("allows usage of any type of property", () => {
      observable.addEventListener("change", spy);
      observable.re = new RegExp("abc");
      expect(spy).toHaveBeenCalledWith(new ChangeEvent(":re", ChangeType.Set));
    });

    it("does not react to changes inside built-in instances of classes that are not Object or Array", () => {
      observable.anyMap = new Map();
      observable.anySet = new Set();
      observable.addEventListener("change", spy);
      observable.anyMap.set("1", 1);
      observable.anySet.add(1);
      expect(observable.anyMap.has("1")).toBe(true);
      expect(observable.anySet.has(1)).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not react to changing symbols", () => {
      const s = Symbol();
      interface A {
        [s]: number;
      }
      const observableWithSymbol = new Observable<A>({ [s]: 1 });
      observableWithSymbol.addEventListener("change", spy);
      observableWithSymbol[s] = 10;
      expect(spy).not.toHaveBeenCalled();
      expect(observableWithSymbol[s]).toBe(10);
    });

    it("does not react to changing non-enumerable properties", () => {
      observable.addEventListener("change", spy);
      Object.defineProperty(observable, "abc", {
        value: 1,
        enumerable: false,
        writable: true,
      });
      (observable as any).abc = 2;
      expect(spy).not.toHaveBeenCalled();
      expect((observable as any).abc).toBe(2);
    });

    it("reacts to deleting properties", () => {
      observable.addEventListener("change", spy);
      delete observable.question;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":question", "DELETE", ""),
        ],
      ]);
    });

    it("does not react to deleting non-existing properties", () => {
      observable.addEventListener("change", spy);
      delete (observable as any).nonexisting;
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not react to deleting properties set up with symbols", () => {
      const s = Symbol();
      interface A {
        [s]?: number;
      }
      const observableWithSymbol = new Observable<A>({ [s]: 1 });
      observableWithSymbol.addEventListener("change", spy);
      delete observableWithSymbol[s];
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not react to deleting non-enumerable properties", () => {
      observable.addEventListener("change", spy);
      Object.defineProperty(observable, "abc", {
        value: 1,
        enumerable: false,
        writable: true,
        configurable: true,
      });
      observable.addEventListener("change", spy);
      delete (observable as any).abc;
      expect(spy).not.toHaveBeenCalled();
    });

    it("reacts to adding elements to nested arrays", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      observable.array.push(4, 5, 6);
      observable.array.unshift(0);
      expect(spy.mock.calls).toEqual([
        [new ChangeEvent(":array", ChangeType.Add, undefined, [4, 5, 6])],
        [new ChangeEvent(":array", ChangeType.Add, undefined, [0])],
      ]);
    });

    it("reacts to changes in objects nested in arrays", () => {
      observable.array = [];
      observable.addEventListener("change", spy);
      observable.array.push({ a: 1 });
      observable.array[0].a = 2;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":array", ChangeType.Add, undefined, [{ a: 2 }]),
        ],
        [
          new ChangeEvent(":array:0:a", ChangeType.Set, 1),
        ],
      ]);
    });

    it("reacts to removing elements from nested arrays", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      observable.array.pop();
      observable.array.shift();
      expect(spy.mock.calls).toEqual([
        [new ChangeEvent(":array", ChangeType.Remove, undefined, 3)],
        [new ChangeEvent(":array", ChangeType.Remove, undefined, 1)],
      ]);
    });

    it("reacts to using splice on nested arrays", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      observable.array.splice(1, 1, 4, 5);
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":array", ChangeType.Remove, undefined, [2]),
        ],
        [
          new ChangeEvent(":array", ChangeType.Add, undefined, [4, 5]),
        ],
      ]);
    });

    it("reacts to using splice without add elements", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      observable.array.splice(1, 1);
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":array", ChangeType.Remove, undefined, [2]),
        ],
      ]);
    });

    it("reacts to sorting nested arrays", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      observable.array.sort();
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":array", ChangeType.Sort),
        ],
      ]);
    });

    it("handles nested observables", () => {
      const a = new Observable<{ b?: number }>({});
      const b = new Observable<{ c?: typeof a }>({});
      const anotherSpy = jest.fn();
      b.addEventListener("change", spy);
      a.addEventListener("change", anotherSpy);
      b.c = a;
      b.c.b = 1;
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":c", ChangeType.Set),
        ],
      ]);
      expect(anotherSpy.mock.calls).toEqual([
        [
          new ChangeEvent(":b", ChangeType.Set),
        ],
      ]);
    });

    it("handles array of observables", () => {
      class A extends Observable<{ b?: number }> {}
      const a = new A({});
      const b = new Observable<{ c: Array<A> }>({ c: [] });
      const anotherSpy = jest.fn();
      b.c.push(a);
      b.addEventListener("change", spy);
      a.addEventListener("change", anotherSpy);
      b.c[0].b = 10;
      b.c.push(a);
      expect(spy.mock.calls).toEqual([
        [
          new ChangeEvent(":c", ChangeType.Add, undefined, [a]),
        ],
      ]);
      expect(anotherSpy.mock.calls).toEqual([
        [
          new ChangeEvent(":b", ChangeType.Set),
        ],
      ]);
    });
  });

  describe("set", () => {
    it("resets the observable with given properties", () => {
      const spy = jest.fn();
      observable.addEventListener("change", spy);
      const attributes = { answer: 1 };
      observable.set(attributes);
      expect(observable.toJSON()).toEqual(attributes);
      expect(spy.mock.calls.length).toBe(4);
    });
  });

  describe("assing", () => {
    it("assigns given properties to the observable", () => {
      const attributes = {
        answer: 4,
        question: "2x2",
      };
      observable.addEventListener("change", spy);
      observable.assign(attributes);
      expect(observable.toJSON()).toEqual({
        answer: 4,
        question: "2x2",
        object: { name: "Zaphod", heads: 1 },
        array: undefined,
      });
      expect(spy.mock.calls.length).toBe(2);
    });
  });

  describe("merge", () => {
    it("merges given properties into the observable", () => {
      const attributes = {
        answer: 1,
        array: [1],
      };
      observable.addEventListener("change", spy);
      observable.merge(attributes);
      expect(observable.toJSON()).toEqual({
        answer: 1,
        question: "",
        object: { name: "Zaphod", heads: 1 },
        array: [1],
      });
      expect(spy.mock.calls.length).toBe(2);
    });

    it("merges nested properties", () => {
      observable.addEventListener("change", spy);
      observable.merge({ object: { name: "Ford" } });
      expect(observable.toJSON()).toEqual({
        answer: 42,
        question: "",
        object: { name: "Ford", heads: 1 },
        array: undefined,
      });
      expect(spy.mock.calls.length).toBe(1);
    });

    it("merges nested arrays", () => {
      observable.array = [1, 2, 3];
      observable.addEventListener("change", spy);
      const arr: Array<number> = [];
      arr[0] = 4;
      arr[3] = 5;
      observable.merge({ array: arr });
      expect(observable.array).toEqual([4, 2, 3, 5]);
      expect(spy.mock.calls.length).toBe(2);
    });
  });

  describe("toJSON", () => {
    it("returns a copy of observable for JSON stringification", () => {
      const observable1 = new Observable({ a: 1, b: 2 });
      expect(observable1.toJSON()).toEqual({ a: 1, b: 2 });
      expect(observable1.toJSON()).not.toBe(observable1);
    });
  });
});
