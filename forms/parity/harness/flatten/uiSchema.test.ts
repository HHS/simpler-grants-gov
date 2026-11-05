import { describe, expect, it } from "vitest";

import type { Fields } from "../model.ts";
import { uiSchemaFields } from "./uiSchema.ts";

describe("uiSchemaFields", () => {
  it("reads controls in order through array detail", () => {
    const ui = {
      type: "Group",
      elements: [
        { type: "Control", scope: "#/properties/note", label: "Note" },
        {
          type: "Control",
          scope: "#/properties/items",
          options: {
            detail: {
              type: "Group",
              elements: [
                { type: "Control", scope: "#/properties/name", label: "Name" },
              ],
            },
          },
        },
      ],
    };
    const schema: Fields = new Map([
      ["items[].name", { help: "Enter it.", rules: {} }],
    ]);
    expect([...uiSchemaFields(ui, schema)]).toEqual([
      ["note", { order: 0, label: "Note", help: undefined, rules: {} }],
      [
        "items[].name",
        { order: 1, label: "Name", help: "Enter it.", rules: {} },
      ],
    ]);
  });
});
