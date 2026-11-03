import { describe, expect, it } from "vitest";

import {
  planFields,
  readConstraints,
  readRequired,
  type Plan,
} from "./plan.ts";

const kinds = (found: { kind: string; path: string }[]) =>
  found.map((d) => `${d.kind}: ${d.path}`);

describe("readRequired", () => {
  it.each([
    [true, "yes"],
    [false, "no"],
    ["No (per XSD; required when section is started)", "no"],
    ["Conditional (when Country = 'USA')", "conditional"],
    ["Sometimes", undefined],
  ] as const)("reads %j as %s", (text, expected) => {
    expect(readRequired(text)).toBe(expected);
  });
});

describe("readConstraints", () => {
  it("reads numeric bounds", () => {
    expect(readConstraints("minLength 1, maxLength 10")).toEqual({
      minLength: 1,
      maxLength: 10,
    });
  });

  it("reads enumeration type names", () => {
    expect(readConstraints("StateCodeDataType enumeration")).toEqual({
      enumType: "StateCodeDataType",
    });
  });

  it("refuses unreadable text", () => {
    expect(readConstraints("max 10 chars")).toBeUndefined();
  });
});

describe("planFields", () => {
  const plan: Plan = {
    slug: "test",
    children: [
      {
        kind: "section",
        label: "Section",
        children: [
          {
            kind: "field",
            label: "First Name",
            dat_field: "7-04",
            required: true,
            constraints: "maxLength 35",
            json_path: "name.first_name",
            xml_path: "Form:ContactName/globLib:FirstName",
          },
          {
            kind: "field",
            label: "Odd",
            required: "Maybe",
            json_path: "odd",
            constraints: "short",
          },
        ],
      },
    ],
  };

  it("keys fields by chosen plan attribute", () => {
    expect([...planFields(plan, "xml_path").keys()]).toEqual([
      "ContactName/FirstName",
    ]);
  });

  it("flags unreadable requiredness and constraints", () => {
    const problems: { kind: string; path: string }[] = [];
    planFields(plan, "json_path", problems);
    expect(kinds(problems)).toEqual([
      "required unreadable: odd",
      "constraints unreadable: odd",
    ]);
  });

  describe("max_items", () => {
    const repeating: Plan = {
      slug: "test",
      children: [
        { kind: "field", label: "Name", required: true, json_path: "name" },
        {
          kind: "section",
          label: "Contacts",
          max_items: 4,
          children: [
            {
              kind: "field",
              label: "Role",
              required: true,
              json_path: "contacts[].role",
            },
            {
              kind: "section",
              label: "Address",
              children: [
                {
                  kind: "field",
                  label: "City",
                  required: true,
                  json_path: "contacts[].address.city",
                },
              ],
            },
            {
              kind: "field",
              label: "Attachment",
              required: false,
              json_path: "contacts[].files[]",
              max_items: "unbounded",
            },
          ],
        },
      ],
    };
    const occurs = (path: string) =>
      planFields(repeating, "json_path").get(path)?.rules.maxOccurs;

    it("defaults to 1", () => {
      expect(occurs("name")).toBe(1);
    });

    it("inherits from the repeating section", () => {
      expect(occurs("contacts[].role")).toBe(4);
    });

    it("inherits through a section nested in the repeating one", () => {
      expect(occurs("contacts[].address.city")).toBe(4);
    });

    it("lets a field override its section", () => {
      expect(occurs("contacts[].files[]")).toBe("unbounded");
    });

    it("keeps fields in plan order across nested sections", () => {
      expect([...planFields(repeating, "json_path").keys()]).toEqual([
        "name",
        "contacts[].role",
        "contacts[].address.city",
        "contacts[].files[]",
      ]);
    });
  });
});
