import { getByPointer, getFieldPathFromHtml } from "./formDataUtils";

jest.mock("json-pointer", () => ({
  get: (...args: unknown[]) => mockJsonPointer(...args) as unknown,
}));

const mockJsonPointer = jest.fn();

describe("getFieldPathFromHtml", () => {
  it("converts field name to JSON pointer path", () => {
    expect(getFieldPathFromHtml("foo--bar")).toBe("/foo/bar");
  });
  it("honors alternate html side delimiters", () => {
    expect(getFieldPathFromHtml("foo.bar", ".")).toBe("/foo/bar");
  });
});

describe("getByPointer", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns undefined if target schema has no content", () => {
    expect(getByPointer({}, "anythinger")).toEqual(undefined);
  });

  it("calls json-pointer with expected args", () => {
    getByPointer({ something: "else " }, "whatever");
    expect(mockJsonPointer).toHaveBeenCalledWith(
      { something: "else " },
      "whatever",
    );
  });

  it("returns undefined if path is not found in target", () => {
    mockJsonPointer.mockImplementation(() => {
      throw new Error("Invalid reference token:");
    });
    const result = getByPointer({ something: "else " }, "whatever");
    expect(result).toEqual(undefined);
  });

  it("returns value from json-pointer", () => {
    mockJsonPointer.mockReturnValue("anything");
    const result = getByPointer({ something: "else " }, "whatever");
    expect(result).toEqual("anything");
  });
});
