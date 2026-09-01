import {
  getByPointer,
  getFieldPathFromHtml,
  isNonSchemaFormDataKey,
} from "src/utils/formData/formDataUtils";

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

describe("isNonSchemaFormDataKey", () => {
  it.each([
    "att1-visible",
    "attachments-visible",
    "budget--attachments-visible",
    "submitType",
    "apply-form-button",
    "opportunity-attachment-upload",
    "held_pending_file_ids",
    "deleted_attachment_ids",
    "$ACTION_REF_1",
    "$ACTION_1:0",
    "$ACTION_KEY",
  ])("identifies control input %s", (key) => {
    expect(isNonSchemaFormDataKey(key)).toBe(true);
  });

  it.each([
    "attachments",
    "att1",
    "budget--attachments",
    "opportunity_title",
    "visible",
  ])("does not claim schema backed field %s", (key) => {
    expect(isNonSchemaFormDataKey(key)).toBe(false);
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
