import { formDataToObject } from "./formDataToJson";

const mockMergeAllOf = jest.fn();

jest.mock("json-schema-merge-allof", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockMergeAllOf(...args) as unknown,
}));

describe("formDataToObject", () => {
  it("correctly converts formData to object", () => {
    const formData = new FormData();
    formData.append("user--name", "Alice");
    formData.append("user--age", "30");
    formData.append("user--emptyString", "");
    formData.append("user--emptyNumber", "");
    formData.append("user--deeper--value", "hello");
    formData.append("user--skills[0]", "JavaScript");
    formData.append("user--skills[1]", "TypeScript");
    formData.append("user--skills[2]--surprise", "more stuff");
    formData.append("nonUser", "false");
    formData.append("empty", "");
    formData.append("numeral", "100");

    const formSchema = {
      user: {
        age: {
          type: "string",
        },
        name: {
          type: "string",
        },
        emptyString: {
          type: "string",
        },
        emptyNumber: {
          type: "number",
        },
        skills: {
          type: "array",
        },
        deeper: {
          value: {
            type: "string",
          },
        },
      },
      nonUser: {
        type: "string",
      },
      empty: {
        type: "string",
      },
      numeral: {
        type: "integer",
      },
    };

    const expected = {
      user: {
        age: "30",
        name: "Alice",
        emptyString: undefined,
        emptyNumber: undefined,
        skills: ["JavaScript", "TypeScript", { surprise: "more stuff" }],
        deeper: {
          value: "hello",
        },
      },
      nonUser: false,
      empty: undefined,
      numeral: 100,
    };

    const result = formDataToObject(formData, formSchema, undefined);

    expect(result).toEqual(expected);
  });
  it("handles json string values", () => {
    const formData = new FormData();
    formData.append("arrayLike", '["i am", "an array", 100, ""]');
    formData.append("complicated", '{"key": "value"}');

    const formSchema = {
      arrayLike: {
        type: "array",
      },
      complicated: { key: { type: "string" } },
    };

    const expected = {
      arrayLike: ["i am", "an array", 100, ""], // should this last one actually be undefined?
      complicated: { key: "value" },
    };

    const result = formDataToObject(formData, formSchema, undefined);

    expect(result).toEqual(expected);
  });
  it("handles falsey values", () => {
    const formData = new FormData();

    formData.append("something--whatever", "a value");

    const formSchema = {
      something: {
        whatever: { type: "string" },
      },
    };

    const result = formDataToObject(formData, formSchema, undefined);

    expect(result.any).toEqual(undefined);
    // eslint-disable-next-line
    // @ts-ignore
    expect(result.something.somethingElse).toEqual(undefined);
  });
  it("handles array paths", () => {
    const formData = new FormData();

    formData.append("something[0]--whatever", "1");

    const formSchema = {
      something: {
        items: { whatever: { type: "number" } },
      },
    };

    const result = formDataToObject(formData, formSchema, undefined);

    // eslint-disable-next-line
    // @ts-ignore
    expect(result.something[0]).toEqual({ whatever: 1 });
  });
  it("respects alternate nested path delimiters", () => {
    const formData = new FormData();

    formData.append("something[0].whatever", "1");

    const formSchema = {
      something: {
        items: { whatever: { type: "number" } },
      },
    };

    const result = formDataToObject(formData, formSchema, undefined, {
      delimiter: ".",
    });

    // eslint-disable-next-line
    // @ts-ignore
    expect(result.something[0]).toEqual({ whatever: 1 });
  });
  it("defaults to null for empty values when specified", () => {
    const formData = new FormData();
    formData.append("whatever", "");
    const formSchema = {
      something: {
        items: { whatever: { type: "string" } },
      },
    };

    const result = formDataToObject(formData, formSchema, null);

    // eslint-disable-next-line
    // @ts-ignore
    expect(result).toEqual({ whatever: null });
  });
  it("defaults to undefined for empty values when specified", () => {
    const formData = new FormData();
    formData.append("whatever", "");
    const formSchema = {
      something: {
        items: { whatever: { type: "string" } },
      },
    };

    const result = formDataToObject(formData, formSchema, undefined);

    // eslint-disable-next-line
    // @ts-ignore
    expect(result).toEqual({ whatever: undefined });
  });
});

/*
  a field whose type cannot be resolved gets its value guessed at, which for submitted
  application data is worth someone's attention. UI only control inputs are filtered out so they
  cannot bury it, so these cover both halves: the control inputs stay silent, and every shape of
  real mismatch still gets a line
*/
describe("formDataToObject undefined field type reporting", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {
      // keeps the expected errors out of the test output
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("stays silent for UI only control inputs and leaves them out of the output", () => {
    const formData = new FormData();
    formData.append("attachments", "an-attachment-id");
    formData.append("attachments-visible", new File([], ""));
    formData.append("submitType", "saveAndExit");
    formData.append("opportunity-attachment-upload", new File([], ""));
    formData.append("held_pending_file_ids", '["pending-1"]');
    formData.append("deleted_attachment_ids", "[]");
    formData.append("$ACTION_KEY", "whatever");

    const formSchema = {
      attachments: { type: "string" },
    };

    const result = formDataToObject(formData, formSchema, undefined);

    expect(result).toEqual({ attachments: "an-attachment-id" });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reports a field with no matching schema definition", () => {
    const formData = new FormData();
    formData.append("typoed_field_name", "a value");

    const formSchema = {
      correct_field_name: { type: "string" },
    };

    formDataToObject(formData, formSchema, undefined);

    // asserted as a prefix rather than expect.any(String) because the e2e check for this
    // ticket is a grep for this exact wording
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Undefined field type shaping form data"),
      { formDataKey: "typoed_field_name", schemaPath: "/typoed_field_name" },
    );
  });

  // the definition resolves here, so this is the mismatch a missing-pointer check alone misses
  it("reports a field whose schema definition omits a type", () => {
    const formData = new FormData();
    formData.append("status", "a value");

    const formSchema = {
      status: { enum: ["a value", "another value"] },
    };

    formDataToObject(formData, formSchema, undefined);

    expect(consoleError).toHaveBeenCalledWith(expect.any(String), {
      formDataKey: "status",
      schemaPath: "/status",
    });
  });

  it("reports a nested field missing from an otherwise valid parent", () => {
    const formData = new FormData();
    formData.append("contact--first_name", "Alice");
    formData.append("contact--typoed_field_name", "a value");

    const formSchema = {
      contact: { first_name: { type: "string" } },
    };

    formDataToObject(formData, formSchema, undefined);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), {
      formDataKey: "contact--typoed_field_name",
      schemaPath: "/contact/typoed_field_name",
    });
  });

  // array keys are rewritten to point at the schema's "items" before the lookup, so the reported
  // path should name the items definition rather than the submitted index
  it("reports an array item field missing from the items definition", () => {
    const formData = new FormData();
    formData.append("activities[0]--cost", "100");
    formData.append("activities[0]--typoed_field_name", "a value");

    const formSchema = {
      activities: { items: { cost: { type: "number" } } },
    };

    formDataToObject(formData, formSchema, undefined);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), {
      formDataKey: "activities[0]--typoed_field_name",
      schemaPath: "/activities/items/typoed_field_name",
    });
  });

  // the case the ticket is about: 356 control input lines per e2e run used to make a line like
  // this one indistinguishable from noise
  it("reports a real mismatch submitted alongside control inputs", () => {
    const formData = new FormData();
    formData.append("attachments", "an-attachment-id");
    formData.append("attachments-visible", new File([], ""));
    formData.append("att1-visible", new File([], ""));
    formData.append("submitType", "saveAndExit");
    formData.append("typoed_field_name", "a value");

    const formSchema = {
      attachments: { type: "string" },
    };

    formDataToObject(formData, formSchema, undefined);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), {
      formDataKey: "typoed_field_name",
      schemaPath: "/typoed_field_name",
    });
  });
});
