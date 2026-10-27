/**
 * The XML mapping format: a mapping shaped like the XML it produces, each element naming
 * where in the response its value comes from. `generateXml` builds a document from one and a
 * response; the API's `xml_generation.mapping` package reads the same file.
 *
 * `schema/xml-mapping.schema.json` describes the same shape for tools that aren't TypeScript.
 */

/** The value of `format`, which tells a reader a mapping is in this format. */
export const XML_MAPPING_FORMAT = "xml-mapping";

export interface XmlMapping {
  format: typeof XML_MAPPING_FORMAT;
  /** Each namespace the document declares, by prefix. `default` is the form's own. */
  namespaces: { default: string } & Record<string, string>;
  /** The XSD the document is valid against. */
  xsd_url?: string;
  /** One key: the root element, and its content. */
  root: Record<string, Elements>;
}

/**
 * An element's content: its child elements and attributes, in the XSD's order. A key starting
 * with `$` is a function (see `Value`); every other key is something to write. A key without a
 * prefix is in the form's own namespace; `prefix:Name` is in another; `@prefix:Name` is an
 * attribute, which always takes a prefix.
 */
export interface Elements {
  [key: string]: Value;
}

/**
 * What an element or attribute is written from. Every input to a function is itself a value,
 * so functions nest: a `$match` can read a `$transform`, and a `case` entry can be a `$when`.
 */
export type Value =
  Field | Const | Match | Transform | Attachment | Each | When | Elements;

/** A `case` entry or `default`: a value, or a plain string, number or boolean as `$const`. */
export type Branch = Value | string | number | boolean;

/** The value at a dotted path, relative to the response or, inside `$each`, to the item. */
export interface Field {
  $field: string;
}

/** A fixed value. */
export interface Const {
  $const: string | number | boolean;
}

/**
 * The `case` entry for a value, or `default`. A string is its own key; anything else is keyed
 * as JSON writes it, so `true` matches `"true"`. A value with neither is an error.
 */
export interface Match {
  $match: { value: Value; case: Record<string, Branch>; default?: Branch };
}

/** A value changed by name, as the API's `TRANSFORMATION_REGISTRY` names it. */
export interface Transform {
  $transform: { name: string; value: Value; params?: Record<string, unknown> };
}

/** The attached file whose upload id is at this path, written as an `att:AttachedFileDataType`. */
export interface Attachment {
  $attachment: string;
}

/** The element once per item of the list `items` yields, `map` read relative to each item. */
export interface Each {
  $each: { items: Value; map: Value };
}

/** `then` when `condition` holds, else `else`, else nothing. */
export interface When {
  $when: { condition: Condition; then: Branch; else?: Branch };
}

export type Condition =
  | { field: string; operator: "equals" | "not_equals"; value: unknown }
  | { field: string; operator: "in"; value: unknown[] }
  | { field: string; operator: "exists" }
  | { all: Condition[] }
  | { any: Condition[] };
