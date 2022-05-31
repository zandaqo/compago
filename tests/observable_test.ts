import { assertEquals, equal, Spy, spy } from "../dev_deps.ts";
import { ChangeEvent, ChangeType, Observable } from "../observable.ts";

const { test } = Deno;

interface IData {
  answer: number;
  question?: string;
  object?: { name: string; heads?: number };
  array?: Array<unknown>;
  re?: RegExp;
  anyMap?: Map<string, unknown>;
  anySet?: Set<unknown>;
}

class DataObservable extends Observable<IData> {}

// HACK: workaround for JSDOM bug introducing a rogue symbol
// deno-lint-ignore ban-types
const hideSymbols = <T extends object>(value: T): T => {
  for (const key of Object.getOwnPropertySymbols(value)) {
    Reflect.defineProperty(value, key, { enumerable: false });
  }
  return value;
};

const observableContext = (
  callback: (observable: DataObservable, changeSpy: Spy) => void,
) => {
  return () => {
    const observable = new DataObservable({
      answer: 42,
      question: "",
      object: { name: "Zaphod", heads: 1 },
      array: undefined,
    });
    hideSymbols(observable);
    const changeSpy = spy();
    observable.addEventListener("change", changeSpy);
    callback(observable, changeSpy);
  };
};

const assertChange = (
  event: unknown,
  path: string,
  kind: ChangeType,
  previous?: unknown,
  elements?: unknown,
) => {
  const isEvent = event instanceof ChangeEvent;
  if (
    !isEvent || event.path !== path || event.kind !== kind ||
    !equal(event.previous, previous) ||
    !equal(event.elements, elements)
  ) {
    throw new Error("Events don't match");
  }
};

test("[Observable#constructor] creates an observable", () => {
  const observable = new Observable({});
  assertEquals(observable instanceof Observable, true);
  assertEquals(hideSymbols(observable.toJSON()), {});
});

test(
  "[Observable@change] emits `change` event",
  observableContext((observable, changeSpy) => {
    observable.answer = 1;
    assertEquals(changeSpy.calls.length, 1);
    assertChange(
      changeSpy.calls[0].args[0],
      ".answer",
      ChangeType.Set,
      42,
    );
  }),
);

test("[Observable@change] handles setter", () => {
  class ObservableSetters
    extends Observable<{ answer?: number; _id?: number }> {
    set setAnswer(value: number) {
      this.answer = value;
    }
  }

  const observableWithSetter = new ObservableSetters({
    answer: 42,
    _id: 10,
  });
  assertEquals(observableWithSetter._id, 10);
  const changeSpy = spy();
  observableWithSetter.addEventListener("change", changeSpy);
  observableWithSetter.setAnswer = 45;
  assertEquals(changeSpy.calls.length, 1);
  assertChange(changeSpy.calls[0].args[0], ".answer", ChangeType.Set, 42);
});

test(
  "[Observable@change] reacts to changes in nested objects",
  observableContext((observable, changeSpy) => {
    observable.object!.name = "Ford";
    observable.assign({ array: [1] });

    assertEquals(changeSpy.calls.length, 2);
    assertChange(
      changeSpy.calls[0].args[0],
      ".object.name",
      ChangeType.Set,
      "Zaphod",
    );
    assertChange(changeSpy.calls[1].args[0], ".array", ChangeType.Set);
  }),
);

test(
  "[Observable@change] reacts to changes in nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [0];
    observable.array[1] = 2;
    assertEquals(changeSpy.calls.length, 2);
    assertChange(changeSpy.calls[0].args[0], ".array", ChangeType.Set);
    assertChange(changeSpy.calls[1].args[0], ".array.1", ChangeType.Set);
  }),
);

test("[Observable@change] handles cyclic self-references", () => {
  interface AB {
    a?: number;
    b?: number;
    c?: AB;
  }
  const ab: AB = { a: 1, b: 1 };
  const abObservable = new Observable(ab);
  assertEquals(abObservable.a, 1);
  abObservable.c = abObservable;
  const changeSpy = spy();
  abObservable.addEventListener("change", changeSpy);
  abObservable.a = 2;
  abObservable.c!.a = 3;
  assertEquals(abObservable.a, 3);
  assertEquals(changeSpy.calls.length, 2);
  assertChange(changeSpy.calls[0].args[0], ".a", ChangeType.Set, 1);
  assertChange(changeSpy.calls[1].args[0], ".a", ChangeType.Set, 2);
});

test("[Observable@change] handles moving objects within", () => {
  interface AB {
    a?: number;
    b?: number;
    c?: { d: number };
    d?: { d: number };
  }
  const ab: AB = { a: 1, b: 1 };
  const abObservable = new Observable(ab);
  assertEquals(abObservable.a, 1);
  abObservable.c = { d: 1 };
  abObservable.d = abObservable.c;
  const changeSpy = spy();
  abObservable.addEventListener("change", changeSpy);
  abObservable.c.d = 2;
  assertEquals(changeSpy.calls.length, 1);
  assertChange(changeSpy.calls[0].args[0], ".d.d", ChangeType.Set, 1);
});

test(
  "[Observable@change] allows usage of any type of property",
  observableContext((observable, changeSpy) => {
    observable.re = new RegExp("abc");
    assertChange(changeSpy.calls[0].args[0], ".re", ChangeType.Set);
  }),
);

test(
  "[Observable@change] does not react to changes inside built-in instances of classes that are not Object or Array",
  observableContext((observable, changeSpy) => {
    observable.anyMap = new Map();
    observable.anySet = new Set();
    observable.anyMap.set("1", 1);
    observable.anySet.add(1);
    assertEquals(observable.anyMap.has("1"), true);
    assertEquals(observable.anySet.has(1), true);
    assertEquals(changeSpy.calls.length, 2);
  }),
);

test(
  "[Observable@change] does not react to changing symbols",
  () => {
    const s = Symbol();
    interface A {
      [s]: number;
    }
    const observableWithSymbol = new Observable({ [s]: 1 });
    const changeSpy = spy();
    observableWithSymbol.addEventListener("change", changeSpy);
    observableWithSymbol[s] = 10;
    assertEquals(observableWithSymbol[s], 10);
    assertEquals(changeSpy.calls.length, 0);
  },
);

test(
  "[Observable@change] does not react to changing non-enumerable properties",
  observableContext((observable, changeSpy) => {
    Object.defineProperty(observable, "abc", {
      value: 1,
      enumerable: false,
      writable: true,
    });
    // deno-lint-ignore no-explicit-any
    (observable as any).abc = 2;
    assertEquals(changeSpy.calls.length, 0);
  }),
);

test(
  "[Observable@change] reacts to deleting properties",
  observableContext((observable, changeSpy) => {
    delete observable.question;
    assertChange(
      changeSpy.calls[0].args[0],
      ".question",
      ChangeType.Delete,
      "",
    );
  }),
);

test(
  "[Observable@change] does not react to deleting non-existing properties",
  observableContext((observable, changeSpy) => {
    // deno-lint-ignore no-explicit-any
    delete (observable as any).nonexisting;
    assertEquals(changeSpy.calls.length, 0);
  }),
);

test(
  "[Observable@change] does not react to deleting properties set up with symbols",
  () => {
    const s = Symbol();
    interface A {
      [s]?: number;
    }
    const observableWithSymbol = new Observable<A>({ [s]: 1 });
    const changeSpy = spy();
    observableWithSymbol.addEventListener("change", changeSpy);
    delete observableWithSymbol[s];
    assertEquals(changeSpy.calls.length, 0);
  },
);

test(
  "[Observable@change] does not react to deleting non-enumerable properties",
  observableContext((observable, changeSpy) => {
    Object.defineProperty(observable, "abc", {
      value: 1,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    // deno-lint-ignore no-explicit-any
    delete (observable as any).abc;
    assertEquals(changeSpy.calls.length, 0);
  }),
);

test(
  "[Observable@change] reacts to adding elements to nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    observable.array.push(4, 5, 6);
    observable.array.unshift(0);
    assertEquals(changeSpy.calls.length, 3);
    assertChange(
      changeSpy.calls[1].args[0],
      ".array",
      ChangeType.Add,
      undefined,
      [4, 5, 6],
    );
    assertChange(
      changeSpy.calls[2].args[0],
      ".array",
      ChangeType.Add,
      undefined,
      [0],
    );
  }),
);

test(
  "[Observable@change] reacts to changes in objects nested in arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [];
    observable.array.push({ a: 1 });
    // deno-lint-ignore no-explicit-any
    (observable.array[0] as any).a = 2;
    assertEquals(changeSpy.calls.length, 3);
    assertChange(
      changeSpy.calls[1].args[0],
      ".array",
      ChangeType.Add,
      undefined,
      [{ a: 2 }],
    );
    assertChange(changeSpy.calls[2].args[0], ".array.0.a", ChangeType.Set, 1);
  }),
);

test(
  "[Observable@change] reacts to removing elements from nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    observable.array.pop();
    observable.array.shift();
    assertEquals(changeSpy.calls.length, 3);
    assertChange(
      changeSpy.calls[1].args[0],
      ".array",
      ChangeType.Remove,
      undefined,
      3,
    );
    assertChange(
      changeSpy.calls[2].args[0],
      ".array",
      ChangeType.Remove,
      undefined,
      1,
    );
  }),
);

test(
  "[Observable@change] reacts to using splice on nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    observable.array.splice(1, 1, 4, 5);
    assertEquals(changeSpy.calls.length, 3);
    assertChange(
      changeSpy.calls[1].args[0],
      ".array",
      ChangeType.Remove,
      undefined,
      [2],
    );
    assertChange(
      changeSpy.calls[2].args[0],
      ".array",
      ChangeType.Add,
      undefined,
      [4, 5],
    );
  }),
);

test(
  "[Observable@change] reacts to using splice without adding elements",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    observable.array.splice(1, 1);
    assertEquals(changeSpy.calls.length, 2);
    assertChange(
      changeSpy.calls[1].args[0],
      ".array",
      ChangeType.Remove,
      undefined,
      [2],
    );
  }),
);

test(
  "[Observable@change] reacts to sorting nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    observable.array.sort();
    assertEquals(changeSpy.calls.length, 2);
    assertChange(changeSpy.calls[1].args[0], ".array", ChangeType.Sort);
  }),
);

test("[Observable@change] handles nested observables", () => {
  const a = new Observable<{ b?: number }>({});
  const b = new Observable<{ c?: typeof a }>({});
  const changeSpy = spy();
  const anotherSpy = spy();
  b.addEventListener("change", changeSpy);
  a.addEventListener("change", anotherSpy);
  b.c = a;
  b.c.b = 1;
  assertEquals(changeSpy.calls.length, 1);
  assertChange(changeSpy.calls[0].args[0], ".c", ChangeType.Set);
  assertEquals(anotherSpy.calls.length, 1);
  assertChange(anotherSpy.calls[0].args[0], ".b", ChangeType.Set);
});

test("[Observable@change] handles array of observables", () => {
  class A extends Observable<{ b?: number }> {}
  const a = new A({});
  const b = new Observable<{ c: Array<A> }>({ c: [] });
  const changeSpy = spy();
  const anotherSpy = spy();
  b.c.push(a);
  b.addEventListener("change", changeSpy);
  a.addEventListener("change", anotherSpy);
  b.c[0].b = 10;
  b.c.push(a);
  assertEquals(changeSpy.calls.length, 1);
  assertChange(changeSpy.calls[0].args[0], ".c", ChangeType.Add, undefined, [
    a,
  ]);
  assertEquals(anotherSpy.calls.length, 1);
  assertChange(anotherSpy.calls[0].args[0], ".b", ChangeType.Set);
});

test(
  "[Observable#set] resets the observable with given properties",
  observableContext((observable, changeSpy) => {
    const attributes = { answer: 1 };
    observable.set(attributes);
    assertEquals(observable.toJSON(), attributes);
    assertEquals(changeSpy.calls.length, 4);
  }),
);

test(
  "[Observable#assign] assigns given properties to the observable",
  observableContext((observable, changeSpy) => {
    const attributes = {
      answer: 4,
      question: "2x2",
    };
    observable.assign(attributes);
    assertEquals(observable.toJSON(), {
      answer: 4,
      question: "2x2",
      object: { name: "Zaphod", heads: 1 },
      array: undefined,
    });
    assertEquals(changeSpy.calls.length, 2);
  }),
);

test(
  "[Observable#merge] merges given properties into the observable",
  observableContext((observable, changeSpy) => {
    const attributes = {
      answer: 1,
      array: [1],
    };
    observable.assign(attributes);
    assertEquals(observable.toJSON(), {
      answer: 1,
      question: "",
      object: { name: "Zaphod", heads: 1 },
      array: [1],
    });
    assertEquals(changeSpy.calls.length, 2);
  }),
);

test(
  "[Observable#set] merges nested properties",
  observableContext((observable, changeSpy) => {
    observable.merge({ object: { name: "Ford" } });
    assertEquals(observable.toJSON(), {
      answer: 42,
      question: "",
      object: { name: "Ford", heads: 1 },
      array: undefined,
    });
    assertEquals(changeSpy.calls.length, 1);
  }),
);

test(
  "[Observable#set] merges nested arrays",
  observableContext((observable, changeSpy) => {
    observable.array = [1, 2, 3];
    const arr: Array<number> = [];
    arr[0] = 4;
    arr[3] = 5;
    observable.merge({ array: arr });
    assertEquals(observable.array, [4, 2, 3, 5]);
    assertEquals(changeSpy.calls.length, 3);
  }),
);

test("[Observable#toJSON] returns a copy of observable for JSON stringification", () => {
  assertEquals(hideSymbols(new Observable({ a: 1, b: 2 })).toJSON(), {
    a: 1,
    b: 2,
  });
  assertEquals(
    new Observable({ a: 1, b: 2 }).toJSON() instanceof Observable,
    false,
  );
});
