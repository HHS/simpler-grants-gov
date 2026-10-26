import * as XLSX from "xlsx";

import type { Fields, Rules } from "../model.ts";

/** Rows of the DAT that are not answers: headings, instructions, navigation buttons. */
const NOT_INPUTS = new Set(["label", "button"]);

/** Implementations whose list is fixed, so its "Max # of Chars" is not a length limit. */
const FIXED_LISTS = new Set(["popup"]);

/** In these rows the shared DAT column means a maximum value, not character length. */
const NUMERIC_TYPES = new Set([
  "$",
  "integer",
  "number",
  "numeric",
  "decimal",
  "currency",
]);

/**
 * `*  Contact 1 Project Role:` -> `* Contact 1 Project Role`. The asterisk the DAT prints on
 * a required field is kept, so the label comparison can check it against the plan.
 */
const label = (text: string) =>
  text
    .replace(/^\s*\*\s*/, "* ")
    .replace(/:\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

/** `4` -> 4; a bound the DAT spells in words, such as `Unbounded`, -> `"unbounded"`. */
const occurrences = (text: unknown): number | "unbounded" | undefined => {
  const value = String(text).trim();
  if (!value) return undefined;
  return /^\d+$/.test(value) ? Number(value) : "unbounded";
};

const header = (text: unknown) =>
  String(text).replace(/\s+/g, " ").trim().toLowerCase();

const COLUMNS = {
  field: "field #",
  label: "field label",
  required: "required?",
  dataType: "data type",
  max: "max # of chars or max value",
  maxOccurs: "maximum occurrences",
  implementation: "field implementation",
  help: "help tip",
} as const;

/**
 * The answers a Grants.gov Data Attribute Table (DAT) workbook describes, keyed by `Field #`.
 *
 * Text length, numeric value bounds and `maxOccurs` are read as rules. The DAT's minimum characters and
 * minimum occurrences are 0 for every optional field and 1 for every required one, so they
 * restate requiredness; the XSD is the authority on `minLength`.
 */
export function datFields(workbook: Uint8Array): Fields {
  const book = XLSX.read(workbook);
  const sheet = book.Sheets["Form DAT"];
  if (!sheet) throw new Error(`no "Form DAT" sheet in ${book.SheetNames}`);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
  const start = rows.findIndex((row) => header(row[0]) === COLUMNS.field);
  if (start === -1) throw new Error('no "Field #" header row in the DAT');
  const names = rows[start].map(header);
  const column = (name: keyof typeof COLUMNS) => {
    const index = names.indexOf(COLUMNS[name]);
    if (index === -1)
      throw new Error(`no "${COLUMNS[name]}" column in the DAT`);
    return index;
  };
  const at = Object.fromEntries(
    Object.keys(COLUMNS).map((name) => [
      name,
      column(name as keyof typeof COLUMNS),
    ]),
  ) as Record<keyof typeof COLUMNS, number>;

  const fields: Fields = new Map();
  for (const row of rows.slice(start + 1)) {
    const id = String(row[at.field]).trim();
    const implementation = header(row[at.implementation]);
    const agency = names.indexOf("agency field name"),
      fieldType = names.indexOf("field type");
    const bound = agency >= 0 && String(row[agency]).trim() !== "";
    const radioOption =
      implementation === "radio" &&
      !bound &&
      fieldType >= 0 &&
      header(row[fieldType]) === "radio group";
    const populated =
      implementation === "label" &&
      bound &&
      fieldType >= 0 &&
      ["post-populated", "post-populate"].includes(header(row[fieldType]));
    if (!id || (NOT_INPUTS.has(implementation) && !populated) || radioOption)
      continue;
    const rules: Rules = {};
    const numeric =
      NUMERIC_TYPES.has(header(row[at.dataType])) ||
      /^decimal\(\d+\)$/.test(header(row[at.dataType]));
    if (numeric) {
      for (const [key, index] of [
        ["minimum", names.indexOf("min # of chars or min value")],
        ["maximum", at.max],
      ] as const) {
        if (index < 0 || String(row[index]).trim() === "") continue;
        const value = Number(row[index]);
        if (!Number.isFinite(value))
          throw new Error(`unreadable DAT numeric ${key} at ${id}`);
        rules[key] = value;
      }
    } else if (String(row[at.max]).trim() && !FIXED_LISTS.has(implementation))
      rules.maxLength = Number(row[at.max]);
    const maxOccurs = occurrences(row[at.maxOccurs]);
    if (maxOccurs !== undefined) rules.maxOccurs = maxOccurs;
    const required = header(row[at.required]);
    fields.set(id, {
      order: fields.size,
      label: label(String(row[at.label])),
      help: String(row[at.help]).trim() || undefined,
      required:
        required === "yes" ? "yes" : required === "no" ? "no" : undefined,
      rules,
    });
  }
  return fields;
}
