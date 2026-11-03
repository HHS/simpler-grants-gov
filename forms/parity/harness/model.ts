/**
 * The vocabulary every layer of the harness shares: how a field is addressed, what a
 * flattened field holds, what a check reports, and how a form records known differences.
 */

import type { XmlFormat } from "./xml.ts";

// ---------------------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------------------

/**
 * A field's address, so two artifacts compare as plain map keys.
 *
 * JSON-side paths are dot-separated property names with `[]` for an array item, the
 * spelling form plans use in `json_path`: `key_contacts[].name.first_name`. XML-side paths
 * are `/`-separated element names below the form's root element, with namespace prefixes
 * dropped: `RoleOnProject/ContactName/FirstName`.
 */
export type Path = string;

/** Parsed JSON, as the compiled artifacts are read. */
export type Json = Record<string, any>;

export const ARRAY = "[]";

/** `["key_contacts", "[]", "name"]` -> `key_contacts[].name`. */
export const render = (segments: readonly string[]): Path =>
  segments.reduce(
    (path, segment) =>
      segment === ARRAY
        ? `${path}${ARRAY}`
        : path
          ? `${path}.${segment}`
          : segment,
    "",
  );

/** A JSON pointer from `index.json`: `/key_contacts/[]/address/city`. */
export const fromPointer = (pointer: string): Path =>
  render(pointer.split("/").filter(Boolean));

/** A JSON Forms scope, `#/properties/a/properties/b`, as its property names. */
export const fromScope = (scope: string): string[] => {
  const tokens = scope.replace(/^#\//, "").split("/");
  const names: string[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    if (tokens[i] !== "properties" || !tokens[i + 1])
      throw new Error(`unsupported scope ${scope}`);
    names.push(tokens[i + 1]);
  }
  return names;
};

/** A plan `xml_path`, `Key_Contacts_2_0:RoleOnProject/globLib:FirstName`, without prefixes. */
export const fromXmlPath = (xmlPath: string): Path =>
  xmlPath
    .split("/")
    .map((step) => step.slice(step.indexOf(":") + 1))
    .join("/");

// ---------------------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------------------

/**
 * Whether an answer is required from the form's root. `conditional` is only ever stated by a
 * plan, and is optional as far as a schema can say.
 */
export type Requiredness = "yes" | "no" | "conditional";

/** Constraint keywords, named as in JSON Schema whichever artifact they were read from. */
export const KEYWORDS = [
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "pattern",
  "format",
  "enum",
  /** The XSD simple type whose enumeration a field draws from, e.g. `StateCodeDataTypeV3`. */
  "enumType",
  /** How many times the field can appear in one form: 1, a bound, or `"unbounded"`. */
  "maxOccurs",
  /** The XML namespace an element is in, as a URI. Only XML artifacts state it. */
  "namespace",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

export type Rules = Partial<Record<Keyword, string | number | string[]>>;

/** One field of a flattened artifact. Anything the artifact does not state is left out. */
export interface FlatField {
  /** Position among the artifact's fields, in document order. */
  order?: number;
  label?: string;
  help?: string;
  required?: Requiredness;
  rules: Rules;
}

export type Fields = Map<Path, FlatField>;

// ---------------------------------------------------------------------------------------
// Recorded differences
// ---------------------------------------------------------------------------------------

/** Why a difference is accepted, as the form library groups and explains them. */
export const CATEGORIES = {
  upstream: {
    label: "Upstream discrepancy",
    description: "The Grants.gov DAT and XSD disagree.",
  },
  intentional: {
    label: "Intentional difference",
    description: "Simpler Grants intentionally differs from Grants.gov.",
  },
  gap: {
    label: "Known gap",
    description: "A known gap awaiting a fix.",
  },
} as const;

export type Category = keyof typeof CATEGORIES;

/** A recorded difference: why it is accepted, and which kind of reason that is. */
export interface Recorded {
  category: Category;
  /** A citation for a Grants.gov defect, the decision, or the issue that will remove it. */
  reason: string;
}

/** A compared value as recorded: a rule, a requiredness, or normalized text. `null` is "not stated". */
export type Value = string | number | string[] | null;

/**
 * A difference recorded with the values it was accepted at. If either side changes, the
 * difference is reported again, so a recorded `maxLength` 4 vs 6 does not also hide 5 vs 6.
 */
export interface Pinned extends Recorded {
  plan: Value;
  source: Value;
}

/** A field the two artifacts name differently: the other artifact's path for a plan path. */
export interface Renamed extends Recorded {
  to: Path;
}

/**
 * The known differences between a form plan and one other artifact.
 *
 * Entries for a value that differs are `Pinned` to the values seen; entries for a field that
 * is absent or misplaced are recorded by path. Keys use the plan's key for the pair
 * (`dat_field` for the DAT, `xml_path` for the XSD, `json_path` otherwise), except
 * `absentFromPlan`, which is keyed by the other artifact's path. An entry that no longer
 * matches a real difference fails the suite, so the record cannot rot.
 */
export interface Registers {
  /** A field the other artifact has and the plan does not. */
  absentFromPlan?: Record<Path, Recorded>;
  /** A plan field the other artifact does not have. */
  absentFromSource?: Record<Path, Recorded>;
  renamed?: Record<Path, Renamed>;
  /** Keyed `path/keyword`, or `path/required` for requiredness. */
  differingRules?: Record<string, Pinned>;
  differingLabels?: Record<Path, Pinned>;
  differingHelp?: Record<Path, Pinned>;
  outOfOrder?: Record<Path, Recorded>;
}

/**
 * Differences a form accepts wholesale rather than field by field: every label, or every help
 * text, that differs, for one reason. Each is still compared and reported with both values,
 * so the form library shows them side by side; only a field's own entry in `differingLabels`
 * or `differingHelp` pins its values.
 */
export interface Wording {
  labels?: Recorded;
  help?: Recorded;
}

/** Everything known to differ between one form's plan and its other artifacts. */
export interface FormDiff {
  /** The plan's `slug`. Its `spec_id` names the compiled form. */
  slug: string;
  /**
   * The XML format the form is checked in. Defaults to `xml-transform`; a form whose XSD wraps
   * fields in elements with no field of their own needs `xml-mapping`, which can write them.
   */
  xml?: XmlFormat;
  /** Labels and help the form takes from its questions rather than from the DAT. */
  wording?: Wording;
  dat?: Registers;
  xsd?: Registers;
  jsonSchema?: Registers;
  uiSchema?: Registers;
  /** Keyed by the compiled schema's path. */
  jsonSchemaVsXsd?: Registers;
  /** Keyed `<json_path> -> <xml_path>`, as the plan links them. */
  xmlMapping?: Registers;
  /** Keyed by the XML mapping's JSON path. */
  xmlMappingVsJsonSchema?: Registers;
  /** Keyed by the XML mapping's element path. */
  xmlMappingVsXsd?: Registers;
}

// ---------------------------------------------------------------------------------------
// Discrepancies
// ---------------------------------------------------------------------------------------

/** One difference between two artifacts. Every check returns these and nothing else. */
export interface Discrepancy {
  /** Stable; tests filter on it. */
  kind: string;
  path: string;
  detail?: string;
  /** The register and key that would record this difference as known. */
  recordAs?: { register: keyof Registers; key: string };
  /** The values compared, for differences a register pins. */
  values?: { plan: Value; source: Value };
}

export const describe = (d: Discrepancy): string =>
  `${d.kind}: ${d.path}${d.detail ? ` -- ${d.detail}` : ""}`;

/** A failure message listing every discrepancy, one per line. */
export const report = (header: string, found: readonly Discrepancy[]): string =>
  [header, ...found.map((d) => `  ${describe(d)}`)].join("\n");
