import type {
  Enum,
  EnumMember,
  Model,
  ModelProperty,
  Program,
  Type,
} from "@typespec/compiler";
import { resolveEncodedName } from "@typespec/compiler";
import { $lib as xmlLib, getNs, isAttribute } from "@typespec/xml";
import {
  jsonPropertyName,
  modelProperties,
  resolveMapping,
  resolveMappingFrom,
  type MappingNode,
  type PropertyCasing,
} from "./simpler-forms.js";
import { reportDiagnostic, stateKeys } from "./lib.js";

/** One form's rules, in the shape `FORM_XML_TRANSFORM_RULES` takes. */
export type XmlTransformRules = Record<string, unknown>;

/**
 * `form`'s XML transform rules in `mapping`, or undefined if `form` is not linked in it.
 *
 * The rules are read off the XSD TypeSpec models and the links between them and the form --
 * `@Mapping.from` on the XSD models, or with `direction` "to", `@Mapping.to` on the form:
 *
 *   - an element's name is its `@Xml.name`, or its property name;
 *   - an element's namespace is its own `@Xml.ns`, or else its model's, which is how an XSD
 *     with `elementFormDefault="qualified"` places a locally declared element: in the
 *     namespace of the schema that declares it. `namespace` is written only where it differs
 *     from the root's, as the API expects;
 *   - the root's `@Xml.ns` names a member of an `@Xml.nsDeclarations` enum, and every member
 *     of that enum is declared on the document;
 *   - a literal-typed `@Xml.attribute` on the root is a fixed root attribute.
 *
 * Rule order is load-bearing -- the API writes elements in the order of the rules -- so rules
 * follow the order the XSD TypeSpec model declares its properties in, which is the XSD's sequence, not
 * the order the form asks its questions in.
 */
export function xmlTransform(
  program: Program,
  form: Model,
  mapping: EnumMember,
  casing: PropertyCasing,
  direction: "to" | "from" = "from",
): XmlTransformRules | undefined {
  let resolved;
  if (direction === "from") {
    const from = resolveMappingFrom(program, form, mapping);
    resolved = from?.resolved;
    // These rules are keyed by the form's properties, so a wrapper element with no property
    // of its own is left out. Reported once per form, naming each.
    const wrappers = (from?.problems ?? []).filter(
      (p) => p.code === "simpler-forms/mapping-from-wrapper",
    );
    const left = [
      ...new Set(
        wrappers.map((w) => {
          const t = w.target as ModelProperty;
          return t.model ? `${t.model.name}.${t.name}` : t.name;
        }),
      ),
    ];
    if (left.length)
      reportDiagnostic(program, {
        code: "xml-wrappers-left-out",
        target: form,
        format: {
          form: form.name,
          count: String(left.length),
          elements: left.join(", "),
        },
      });
  } else resolved = resolveMapping(program, form, mapping);
  if (!resolved) return undefined;
  const root = resolved.target;
  const rootNs = getNs(program, root);
  if (!rootNs) {
    reportDiagnostic(program, {
      code: "xml-root-namespace-missing",
      target: root,
      format: { name: root.name, mapping: mapping.name },
    });
    return undefined;
  }

  const rootElement = xmlName(program, root);
  const xsdUrl = program.stateMap(stateKeys.xsd).get(root) as
    string | undefined;
  const attributes = Object.fromEntries(
    modelProperties(root)
      .filter((prop) => isAttribute(program, prop))
      .flatMap((prop) => {
        const value = literalValue(prop.type);
        return value === undefined ? [] : [[xmlName(program, prop), value]];
      }),
  );

  const rules = new Rules(program, casing, rootNs.namespace);
  return {
    _xml_config: {
      form_name: rootNs.prefix,
      namespaces: {
        default: rootNs.namespace,
        ...declaredNamespaces(program, rootNs),
      },
      ...(xsdUrl ? { xsd_url: xsdUrl } : {}),
      xml_structure: {
        root_element: rootElement,
        root_namespace_prefix: rootNs.prefix,
        ...(Object.keys(attributes).length
          ? { root_attributes: attributes }
          : {}),
      },
    },
    ...rules.of(resolved.children),
  };
}

class Rules {
  constructor(
    private readonly program: Program,
    private readonly casing: PropertyCasing,
    private readonly defaultNamespace: string,
  ) {}

  /** Rules for one level, in the target's order. */
  of(nodes: MappingNode[]): XmlTransformRules {
    return Object.fromEntries(
      [...nodes]
        .sort((a, b) => position(a) - position(b))
        .map((node) => [
          jsonPropertyName(this.program, node.source, this.casing),
          this.rule(node),
        ]),
    );
  }

  private rule(node: MappingNode): XmlTransformRules {
    // A group has no element of its own: its children land in the parent's.
    if (node.kind === "group") return this.of(node.children);
    const target = node.target!;
    const namespace = elementNamespace(this.program, target);
    const transform = {
      target: xmlName(this.program, target),
      ...(node.kind === "object" ? { type: "nested_object" } : {}),
      ...(node.kind === "array" ? { type: "array" } : {}),
      ...(namespace && namespace.namespace !== this.defaultNamespace
        ? { namespace: namespace.prefix }
        : {}),
    };
    if (node.kind === "object")
      return { xml_transform: transform, ...this.of(node.children) };
    if (node.kind === "array" && node.children.length)
      return { xml_transform: transform, items: this.of(node.children) };
    return { xml_transform: transform };
  }
}

/** Where a node sits in its target's sequence. A group sits where its first child does. */
function position(node: MappingNode): number {
  if (!node.target)
    return Math.min(...node.children.map(position), Number.MAX_SAFE_INTEGER);
  const model = node.target.model;
  return model ? modelProperties(model).indexOf(node.target) : 0;
}

const xmlName = (program: Program, type: Model | ModelProperty) =>
  resolveEncodedName(program, type, "application/xml");

const elementNamespace = (program: Program, prop: ModelProperty) =>
  getNs(program, prop) ?? (prop.model ? getNs(program, prop.model) : undefined);

/** Every namespace the enum that declares the root's namespace declares, by prefix. */
function declaredNamespaces(
  program: Program,
  rootNs: { namespace: string; prefix: string },
): Record<string, string> {
  const enums = program.stateSet(xmlLib.stateKeys.nsDeclaration) as Set<Enum>;
  for (const declarations of enums) {
    const members = [...declarations.members.values()];
    if (
      !members.some(
        (m) => m.name === rootNs.prefix && m.value === rootNs.namespace,
      )
    )
      continue;
    return Object.fromEntries(members.map((m) => [m.name, String(m.value)]));
  }
  return { [rootNs.prefix]: rootNs.namespace };
}

function literalValue(type: Type): string | number | boolean | undefined {
  if (
    type.kind === "String" ||
    type.kind === "Number" ||
    type.kind === "Boolean"
  )
    return type.value;
  return undefined;
}
