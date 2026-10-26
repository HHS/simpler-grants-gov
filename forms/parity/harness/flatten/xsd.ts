import { XMLParser } from "fast-xml-parser";

import type { Fields, Path, Rules } from "../model.ts";

/**
 * The answers an XSD describes, keyed by element path below the form's root element.
 *
 * This reads only the constructs Grants.gov form schemas use. Anything else throws rather
 * than being skipped, so a form that needs more of XSD fails loudly instead of passing with
 * fields missing.
 */

const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * `att:AttachedFileDataType`: one attached file. The applicant answers it with a file, and the
 * file's name, type, location and hash are written from the upload, so it is one leaf.
 */
const ATTACHMENTS = "http://apply.grants.gov/system/Attachments-V1.0";
const ATTACHED_FILE = "AttachedFileDataType";

type XNode = Record<string, unknown>;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: false,
});

const tagOf = (node: XNode) => Object.keys(node).find((key) => key !== ":@")!;
const localOf = (name: string) => name.slice(name.indexOf(":") + 1);
const attrs = (node: XNode) => (node[":@"] ?? {}) as Record<string, string>;
const children = (node: XNode) =>
  ((node[tagOf(node)] ?? []) as XNode[]).filter(
    (child) => !["#text", "#comment"].includes(tagOf(child)),
  );
const childNamed = (node: XNode, local: string) =>
  children(node).find((child) => localOf(tagOf(child)) === local);

interface Schema {
  url: string;
  targetNamespace: string;
  /** Whether a locally declared element is in `targetNamespace` unless it says otherwise. */
  qualified: boolean;
  prefixes: Map<string, string>;
  simpleTypes: Map<string, XNode>;
  complexTypes: Map<string, XNode>;
  elements: Map<string, XNode>;
  groups: Map<string, XNode>;
  attributes: Map<string, XNode>;
}

/** A named declaration and the schema it was declared in, for resolving its own references. */
interface Declared {
  node: XNode;
  schema: Schema;
  name: string;
}

class Schemas {
  private readonly byNamespace = new Map<string, Schema>();
  private readonly read: (url: string) => string;

  constructor(read: (url: string) => string) {
    this.read = read;
  }

  load(url: string): Schema {
    const root = (parser.parse(this.read(url)) as XNode[]).find(
      (node) => localOf(tagOf(node)) === "schema",
    );
    if (!root) throw new Error(`${url} is not an XSD`);
    const declared = attrs(root);
    const schema: Schema = {
      url,
      targetNamespace: declared.targetNamespace ?? "",
      qualified: declared.elementFormDefault === "qualified",
      prefixes: new Map(
        Object.entries(declared)
          .filter(([key]) => key === "xmlns" || key.startsWith("xmlns:"))
          .map(([key, ns]) => [key === "xmlns" ? "" : key.slice(6), ns]),
      ),
      simpleTypes: new Map(),
      complexTypes: new Map(),
      elements: new Map(),
      groups: new Map(),
      attributes: new Map(),
    };
    if (this.byNamespace.has(schema.targetNamespace))
      return this.byNamespace.get(schema.targetNamespace)!;
    this.byNamespace.set(schema.targetNamespace, schema);
    for (const child of children(root)) {
      const kind = localOf(tagOf(child));
      const { name, schemaLocation } = attrs(child);
      if (kind === "import" || kind === "include") {
        if (schemaLocation) this.load(new URL(schemaLocation, url).href);
      } else if (kind === "simpleType") schema.simpleTypes.set(name, child);
      else if (kind === "complexType") schema.complexTypes.set(name, child);
      else if (kind === "element") schema.elements.set(name, child);
      else if (kind === "group") schema.groups.set(name, child);
      else if (kind === "attribute") schema.attributes.set(name, child);
      else if (kind !== "annotation" && kind !== "attribute")
        throw new Error(`unsupported top-level xs:${kind} in ${url}`);
    }
    return schema;
  }

  /** `globLib:HumanNameDataType`, read in `from`, as its namespace and local name. */
  private qualify(qname: string, from: Schema) {
    const colon = qname.indexOf(":");
    const prefix = colon === -1 ? "" : qname.slice(0, colon);
    const ns =
      from.prefixes.get(prefix) ?? (prefix ? undefined : from.targetNamespace);
    if (ns === undefined)
      throw new Error(`unknown prefix in ${qname} (${from.url})`);
    return { ns, name: localOf(qname) };
  }

  isBuiltin(qname: string, from: Schema) {
    return this.qualify(qname, from).ns === XS;
  }

  find(
    table:
      "simpleTypes" | "complexTypes" | "elements" | "groups" | "attributes",
    qname: string,
    from: Schema,
  ): Declared | undefined {
    const { ns, name } = this.qualify(qname, from);
    const schema = this.byNamespace.get(ns);
    if (!schema) throw new Error(`no schema loaded for ${ns} (${qname})`);
    const node = schema[table].get(name);
    return node && { node, schema, name };
  }
}

const IGNORED_FACETS = new Set(["totalDigits", "whiteSpace", "annotation"]);

type MaxOccurs = number | "unbounded";

/** How many times something inside `outer` can appear, given its own `maxOccurs`. */
const times = (outer: MaxOccurs, own: string | undefined): MaxOccurs =>
  own === undefined
    ? outer
    : own === "unbounded" || outer === "unbounded"
      ? "unbounded"
      : outer * Number(own);

/** One explicitly declared imported global-element reference, not an opaque arbitrary path. */
export interface ExternalFormReference {
  path: string;
  xsd_url: string;
  namespace: string;
  element: string;
  min_occurs: number;
  max_occurs: MaxOccurs;
}
export interface ExternalFormObservation extends ExternalFormReference {
  required: boolean;
  maxOccurs: MaxOccurs;
  payload_qualification: "not_compared";
}
interface ProjectionOptions {
  externalForms?: ExternalFormReference[];
  observations?: ExternalFormObservation[];
}

class Walker {
  readonly fields: Fields = new Map();
  private readonly schemas: Schemas;
  private readonly external: Map<string, ExternalFormReference>;
  private readonly observed = new Set<string>();
  private readonly observations: ExternalFormObservation[];
  /** How many times the element being walked can appear in one form. */
  private repeats: MaxOccurs = 1;
  private readonly activeGroups = new Set<XNode>();
  /** The namespace of the element being walked; empty for an unqualified one. */
  private namespace = "";

  /** Walks `body` inside something that repeats up to `maxOccurs` times. */
  private repeating(maxOccurs: string | undefined, body: () => void) {
    const outer = this.repeats;
    this.repeats = times(outer, maxOccurs);
    try {
      body();
    } finally {
      this.repeats = outer;
    }
  }

  constructor(schemas: Schemas, options: ProjectionOptions = {}) {
    this.schemas = schemas;
    const declared = options.externalForms ?? [];
    if (
      declared.some(
        (entry, i) =>
          !entry.path ||
          !entry.xsd_url ||
          !entry.namespace ||
          !entry.element ||
          declared.some(
            (other, j) =>
              i !== j &&
              (entry.path === other.path ||
                entry.path.startsWith(other.path + "/")),
          ),
      )
    )
      throw new Error(
        "External form references must have unique non-overlapping paths and complete identities",
      );
    this.external = new Map(declared.map((entry) => [entry.path, entry]));
    this.observations = options.observations ?? [];
  }

  finish() {
    for (const path of this.external.keys())
      if (!this.observed.has(path))
        throw new Error(
          `External form is not a resolved global element reference at ${path}`,
        );
    return this.fields;
  }

  /** Rules of a simple type, its base's first. `name` is the type's own, if it is named. */
  simpleRules(node: XNode, schema: Schema, name?: string): Rules {
    const restriction = childNamed(node, "restriction");
    if (!restriction)
      throw new Error(
        `unsupported simple type ${name ?? "(anonymous)"}: only xs:restriction is read`,
      );
    const base = attrs(restriction).base;
    let rules: Rules = {};
    if (base && !this.schemas.isBuiltin(base, schema)) {
      const declared = this.schemas.find("simpleTypes", base, schema);
      if (!declared) throw new Error(`unknown simple type ${base}`);
      rules = this.simpleRules(declared.node, declared.schema, declared.name);
    }
    const values: string[] = [];
    for (const facet of children(restriction)) {
      const kind = localOf(tagOf(facet));
      const { value } = attrs(facet);
      if (kind === "enumeration") values.push(value);
      else if (kind === "minLength" || kind === "maxLength")
        rules[kind] = Number(value);
      else if (kind === "length")
        rules.minLength = rules.maxLength = Number(value);
      else if (kind === "minInclusive") rules.minimum = Number(value);
      else if (kind === "maxInclusive") rules.maximum = Number(value);
      else if (kind === "fractionDigits") {
        const digits = Number(value);
        const step = Number(`1e-${digits}`);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(digits) || step <= 0)
          throw new Error(`unsupported fractionDigits ${value}`);
        rules.multipleOf = step;
      } else if (kind === "pattern") rules.pattern = value;
      else if (!IGNORED_FACETS.has(kind))
        throw new Error(`unsupported facet xs:${kind}`);
    }
    if (values.length) {
      rules.enum = values;
      if (name) rules.enumType = name;
      else delete rules.enumType;
    }
    return rules;
  }

  /** An element's own namespace is recorded; an attribute's is not. */
  leaf(path: Path, required: boolean, rules: Rules, element = true) {
    this.fields.set(path, {
      order: this.fields.size,
      required: required ? "yes" : "no",
      rules: {
        ...rules,
        maxOccurs: this.repeats,
        ...(element ? { namespace: this.namespace } : {}),
      },
    });
  }

  /**
   * `global` for an element declared at the top level of `schema`, which is always in its
   * target namespace; a local one is only if the schema or the element qualifies it.
   */
  element(
    node: XNode,
    schema: Schema,
    parent: Path,
    required: boolean,
    global = false,
  ): void {
    const declared = attrs(node);
    if (declared.ref) {
      const global = this.schemas.find("elements", declared.ref, schema);
      if (!global) throw new Error(`unknown element ${declared.ref}`);
      const path = parent ? `${parent}/${global.name}` : global.name;
      const external = this.external.get(path);
      if (external) {
        if (this.observed.has(path))
          throw new Error(
            `External form source reference is ambiguous at ${path}`,
          );
        if (
          global.schema.url !== external.xsd_url ||
          global.schema.targetNamespace !== external.namespace ||
          global.name !== external.element ||
          Number(declared.minOccurs ?? 1) !== external.min_occurs ||
          (declared.maxOccurs === "unbounded"
            ? "unbounded"
            : Number(declared.maxOccurs ?? 1)) !== external.max_occurs
        )
          throw new Error(`External form source identity differs at ${path}`);
        this.observed.add(path);
        const own = required && Number(declared.minOccurs ?? 1) > 0;
        this.repeating(declared.maxOccurs, () => {
          this.observations.push({
            ...external,
            required: own,
            maxOccurs: this.repeats,
            payload_qualification: "not_compared",
          });
          const outer = this.namespace;
          this.namespace = global.schema.targetNamespace;
          try {
            this.leaf(path, own, {});
          } finally {
            this.namespace = outer;
          }
        });
        return;
      }
      const merged = {
        ...global.node,
        ":@": { ...attrs(global.node), ...declared, ref: undefined },
      };
      return this.element(merged, global.schema, parent, required, true);
    }
    if (declared.fixed !== undefined) return;
    const path = parent ? `${parent}/${declared.name}` : declared.name;
    const own = required && Number(declared.minOccurs ?? 1) > 0;
    const qualified =
      global ||
      (declared.form ?? (schema.qualified ? "qualified" : "")) === "qualified";
    const outer = this.namespace;
    this.namespace = qualified ? schema.targetNamespace : "";
    try {
      this.repeating(declared.maxOccurs, () =>
        this.contents(node, schema, declared, path, own),
      );
    } finally {
      this.namespace = outer;
    }
  }

  /** What an element holds: a complex type to walk, or a simple type that makes it a leaf. */
  private contents(
    node: XNode,
    schema: Schema,
    declared: Record<string, string>,
    path: Path,
    own: boolean,
  ): void {
    const complex = childNamed(node, "complexType");
    const simple = childNamed(node, "simpleType");
    if (complex) return this.complex(complex, schema, path, own);
    if (simple) return this.leaf(path, own, this.simpleRules(simple, schema));
    if (!declared.type || this.schemas.isBuiltin(declared.type, schema))
      return this.leaf(path, own, {});
    const named = this.schemas.find("simpleTypes", declared.type, schema);
    if (named)
      return this.leaf(
        path,
        own,
        this.simpleRules(named.node, named.schema, named.name),
      );
    const type = this.schemas.find("complexTypes", declared.type, schema);
    if (!type) throw new Error(`unknown type ${declared.type} on ${path}`);
    if (
      type.schema.targetNamespace === ATTACHMENTS &&
      type.name === ATTACHED_FILE
    )
      return this.leaf(path, own, {});
    this.complex(type.node, type.schema, path, own);
  }

  complex(node: XNode, schema: Schema, path: Path, required: boolean) {
    for (const child of children(node)) {
      const kind = localOf(tagOf(child));
      if (kind === "sequence" || kind === "choice")
        this.group(child, schema, path, required, kind === "choice");
      else if (kind === "group")
        this.groupReference(child, schema, path, required);
      else if (kind === "attribute")
        this.attribute(child, schema, path, required);
      else if (kind === "complexContent")
        this.extension(child, schema, path, required);
      else if (kind === "simpleContent")
        this.simpleContent(child, schema, path, required);
      else if (kind !== "annotation")
        throw new Error(`unsupported xs:${kind} in ${path}`);
    }
  }

  group(
    node: XNode,
    schema: Schema,
    path: Path,
    required: boolean,
    choice: boolean,
  ) {
    const own = required && Number(attrs(node).minOccurs ?? 1) > 0;
    this.repeating(attrs(node).maxOccurs, () => {
      for (const child of children(node)) {
        const kind = localOf(tagOf(child));
        // A member of a choice is never required on its own: another member can stand in.
        const member = own && !choice;
        if (kind === "element") this.element(child, schema, path, member);
        else if (kind === "group")
          this.groupReference(child, schema, path, member);
        else if (kind === "sequence" || kind === "choice")
          this.group(child, schema, path, member, kind === "choice");
        else if (kind !== "annotation")
          throw new Error(`unsupported xs:${kind} in ${path}`);
      }
    });
  }

  private groupReference(
    node: XNode,
    schema: Schema,
    path: Path,
    required: boolean,
  ) {
    const ref = attrs(node).ref;
    const declared = ref && this.schemas.find("groups", ref, schema);
    if (!declared) throw new Error(`unknown group ${ref} in ${path}`);
    if (this.activeGroups.has(declared.node))
      throw new Error(`recursive group ${ref}`);
    this.activeGroups.add(declared.node);
    try {
      this.repeating(attrs(node).maxOccurs, () =>
        this.complex(
          declared.node,
          declared.schema,
          path,
          required && Number(attrs(node).minOccurs ?? 1) > 0,
        ),
      );
    } finally {
      this.activeGroups.delete(declared.node);
    }
  }

  extension(node: XNode, schema: Schema, path: Path, required: boolean) {
    const extension = childNamed(node, "extension");
    if (!extension)
      throw new Error(
        `unsupported complex content in ${path}: only xs:extension is read`,
      );
    const base = this.schemas.find(
      "complexTypes",
      attrs(extension).base,
      schema,
    );
    if (!base)
      throw new Error(`unknown base ${attrs(extension).base} in ${path}`);
    this.complex(base.node, base.schema, path, required);
    this.complex(extension, schema, path, required);
  }

  simpleContent(node: XNode, schema: Schema, path: Path, required: boolean) {
    const extension = childNamed(node, "extension");
    if (!extension)
      throw new Error(
        `unsupported simple content in ${path}: only xs:extension is read`,
      );
    const { base } = attrs(extension);
    const named = this.schemas.isBuiltin(base, schema)
      ? undefined
      : this.schemas.find("simpleTypes", base, schema);
    this.leaf(
      path,
      required,
      named ? this.simpleRules(named.node, named.schema, named.name) : {},
    );
    for (const child of children(extension))
      if (localOf(tagOf(child)) === "attribute")
        this.attribute(child, schema, path, required);
  }

  attribute(node: XNode, schema: Schema, path: Path, required: boolean): void {
    const own = attrs(node);
    if (own.ref) {
      const declared = this.schemas.find("attributes", own.ref, schema);
      if (!declared) throw new Error(`unknown attribute ${own.ref}`);
      return this.attribute(
        {
          ...declared.node,
          ":@": { ...attrs(declared.node), ...own, ref: undefined },
        },
        declared.schema,
        path,
        required,
      );
    }
    const { name, type, use, fixed } = own;
    if (fixed !== undefined) return;
    const named =
      type && !this.schemas.isBuiltin(type, schema)
        ? this.schemas.find("simpleTypes", type, schema)
        : undefined;
    this.leaf(
      `${path}/@${name}`,
      required && use === "required",
      named ? this.simpleRules(named.node, named.schema, named.name) : {},
      false,
    );
  }
}

/**
 * Flattens the form XSD at `url`, reading it and every schema it imports through `read`.
 * Elements and attributes with a `fixed` value are constants, not answers, and are left out.
 */
export function xsdFields(
  url: string,
  read: (url: string) => string,
  rootElement?: string,
  options: ProjectionOptions = {},
): Fields {
  const schemas = new Schemas(read);
  const schema = schemas.load(url);
  const roots = rootElement
    ? [schema.elements.get(rootElement)].filter((n): n is XNode => Boolean(n))
    : [...schema.elements.values()];
  if (roots.length !== 1)
    throw new Error(
      `expected one selected root element in ${url}, found ${roots.length}`,
    );
  const walker = new Walker(schemas, options);
  const complex = childNamed(roots[0], "complexType");
  if (complex) walker.complex(complex, schema, "", true);
  else {
    const type = attrs(roots[0]).type;
    const declared = type && schemas.find("complexTypes", type, schema);
    if (!declared)
      throw new Error(`root element of ${url} has no complex type`);
    walker.complex(declared.node, declared.schema, "", true);
  }
  return walker.finish();
}
