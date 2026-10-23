import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { datFields } from "./dat.ts";

describe("datFields", () => {
  const workbook = (rows: unknown[][]) => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(rows),
      "Form DAT",
    );
    return XLSX.write(book, { type: "buffer", bookType: "xls" }) as Uint8Array;
  };
  const HEADER = [
    "Field #",
    "Field\nLabel",
    "Required?",
    "Data Type",
    "Max # of\nChars or\nMax Value",
    "Maximum\nOccurrences",
    "Field\nImplementation",
    "Help Tip",
  ];

  it("reads input rows and skips labels and buttons", () => {
    const dat = datFields(
      workbook([
        ["FORM TITLE:"],
        HEADER,
        ["1", "OMB Number", "", "", "", "", "Label", ""],
        [
          "5",
          "* Organization Name:",
          "Yes",
          "AN",
          60,
          1,
          "Field",
          "Enter the name.",
        ],
        ["8-1", "Delete Entry", "", "", "", "", "Button", ""],
      ]),
    );
    expect([...dat]).toEqual([
      [
        "5",
        {
          order: 0,
          label: "* Organization Name",
          help: "Enter the name.",
          required: "yes",
          rules: { maxLength: 60, maxOccurs: 1 },
        },
      ],
    ]);
  });

  it("reads no length from fixed lists", () => {
    const dat = datFields(
      workbook([HEADER, ["7-14", "State:", "No", "LIST", 55, 4, "Popup", ""]]),
    );
    expect(dat.get("7-14")?.rules).toEqual({ maxOccurs: 4 });
  });

  it.each(["$", "INTEGER", "DECIMAL(2)"])(
    "does not reinterpret %s value bounds as character lengths",
    (type) => {
      const dat = datFields(
        workbook([
          HEADER,
          ["01-a", "$", "No", type, 9999999999.99, 1, "Field", ""],
        ]),
      );
      expect(dat.get("01-a")?.rules).toEqual({ maxOccurs: 1 });
    },
  );

  it("keeps asterisk on required labels", () => {
    const dat = datFields(
      workbook([
        HEADER,
        ["7-14", "  *   State:", "No", "LIST", 55, 4, "Popup", ""],
      ]),
    );
    expect(dat.get("7-14")?.label).toBe("* State");
  });

  it("reads worded bound as unbounded", () => {
    const dat = datFields(
      workbook([
        HEADER,
        ["9", "Note:", "No", "AN", 10, "Unbounded", "Field", ""],
      ]),
    );
    expect(dat.get("9")?.rules.maxOccurs).toBe("unbounded");
  });
});
