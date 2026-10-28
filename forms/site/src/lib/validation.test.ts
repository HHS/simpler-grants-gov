import { describe, expect, it } from "vitest";

import {
  completeWarnings,
  createAjv,
  toValidationWarnings,
  uniqueWarnings,
} from "./validation";

const schema = {
  type: "object",
  properties: {
    contacts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          country: { type: "string" },
          state: { type: "string" },
          firstName: { type: "string", maxLength: 3 },
          email: { type: "string", format: "email" },
        },
        required: ["firstName"],
        if: {
          properties: { country: { const: "USA" } },
          required: ["country"],
        },
        then: { required: ["state"] },
      },
    },
  },
};

const warnings = (data: unknown) => {
  const validate = createAjv().compile(schema);
  validate(data);
  return toValidationWarnings(validate.errors ?? []);
};

describe("toValidationWarnings", () => {
  it("reports a missing field at its own path, like the API", () => {
    expect(warnings({ contacts: [{}] })).toEqual([
      {
        field: "$.contacts[0].firstName",
        message: "'firstName' is a required property",
        type: "required",
        value: null,
      },
    ]);
  });

  it("uses the API's wording for constraint failures", () => {
    expect(
      warnings({ contacts: [{ firstName: "Susan", email: "nope" }] }).map(
        ({ field, message }) => [field, message],
      ),
    ).toEqual([
      ["$.contacts[0].firstName", "'Susan' is too long"],
      ["$.contacts[0].email", "'nope' is not a 'email'"],
    ]);
  });

  it("reports an empty list as non-empty", () => {
    expect(warnings({ contacts: [] })[0]).toMatchObject({
      field: "$.contacts",
      message: "[] should be non-empty",
    });
  });

  it("drops Ajv's summary error for a failed if/then", () => {
    expect(
      warnings({ contacts: [{ firstName: "Sue", country: "USA" }] }).map(
        (w) => w.field,
      ),
    ).toEqual(["$.contacts[0].state"]);
  });
});

describe("uniqueWarnings", () => {
  const warning = (field: string, message: string) => ({
    field,
    message,
    type: "minLength",
    value: null,
  });

  it("keeps one of each warning a field repeats", () => {
    expect(
      uniqueWarnings([
        warning("$.name.first_name", "'' is too short"),
        warning("$.name.first_name", "'' is too short"),
        warning("$.name.last_name", "'' is too short"),
      ]),
    ).toEqual([
      warning("$.name.first_name", "'' is too short"),
      warning("$.name.last_name", "'' is too short"),
    ]);
  });
});

describe("completeWarnings", () => {
  const raw = {
    field: "$.files[0]",
    message: "invalid id",
    type: "format",
    value: null,
  };
  it("preserves unplaced failures instead of reporting false success", () => {
    expect(completeWarnings([raw], [])).toEqual([
      { ...raw, formatted: "$.files[0]: invalid id" },
    ]);
  });
  it("retains existing formatting without duplicating the same validator failure", () => {
    const placed = {
      ...raw,
      formatted: "File reference is invalid",
      htmlField: "files[0]",
    };
    expect(completeWarnings([raw], [placed])).toEqual([placed]);
  });
  it("does not discard a different failure at the same path", () => {
    const other = { ...raw, type: "minLength", message: "too short" };
    expect(
      completeWarnings(
        [raw, other],
        [{ ...raw, formatted: "Existing wording" }],
      ),
    ).toHaveLength(2);
    expect(completeWarnings([], [])).toEqual([]);
  });
});
