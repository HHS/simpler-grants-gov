import { RJSFSchema } from "@rjsf/utils";

import { formDataToObject } from "src/components/applyForm/formDataToJson";

const mockHandleFormAction = jest.fn();
const mockRevalidateTag = jest.fn();
const getSessionMock = jest.fn();
const mockMergeAllOf = jest.fn();

// all of these mocks should not be necessary but are currently because of cascading imports
// of widgets and React based code within the imported utils file
// mocks should be removed as part of https://github.com/HHS/simpler-grants-gov/pull/5963
jest.mock("src/components/applyForm/actions", () => ({
  handleFormAction: (...args: unknown[]) =>
    mockHandleFormAction(...args) as unknown,
}));

jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag) as unknown,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useCallback: (fn: unknown) => fn,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

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

    const result = formDataToObject(formData, formSchema as RJSFSchema, {
      delimiter: "--",
    });

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

    const result = formDataToObject(formData, formSchema);

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

    const result = formDataToObject(formData, formSchema, { delimiter: "--" });

    expect(result.any).toEqual(undefined);
    // eslint-disable-next-line
    // @ts-ignore
    expect(result.something.somethingElse).toEqual(undefined);
  });
  it("handles array paths", () => {
    const formData = new FormData();

    formData.append("something[0]--whatever", "a value");

    const formSchema = {
      something: {
        items: { type: "object", properties: { whatever: { type: "string" } } },
      },
    };

    const result = formDataToObject(formData, formSchema, { delimiter: "--" });

    // eslint-disable-next-line
    // @ts-ignore
    expect(result.something[0]).toEqual({ whatever: "a value" });
  });
});
