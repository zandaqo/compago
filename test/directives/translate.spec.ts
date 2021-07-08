import { NodePart, RenderOptions } from "lit-html";
import { translate } from "../../src/directives/translate";
import { Component } from "../../src/component";
import { jest } from "@jest/globals";

describe("translate", () => {
  it("calls a translator", () => {
    class C extends Component<{ a: number }> {}
    C.translate = jest.fn();
    const interpolation = {};
    translate(C, "apple", interpolation)(new NodePart({} as RenderOptions));
    expect(C.translate).toHaveBeenCalledWith("apple", interpolation);
  });
});
