import {
  createTypeSpecLibrary,
  paramMessage,
  type JSONSchemaType,
} from "@typespec/compiler";

export interface XmlEmitterOptions {
  /** The `@Mapping.targets` members to emit, by name. */
  "mapping-targets": string[];
  /** Must match the `simpler-forms` emitter's, so rule keys name the schema's properties. */
  "property-casing"?: "preserve" | "snake";
  /**
   * Which links the rules are read from: `@Mapping.from` on the XSD TypeSpec models (`from`,
   * the default), or `@Mapping.to` on the forms (`to`).
   */
  "mapping-direction"?: "to" | "from";
}

const EmitterOptionsSchema: JSONSchemaType<XmlEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "mapping-targets": { type: "array", items: { type: "string" } },
    "property-casing": {
      type: "string",
      enum: ["preserve", "snake"],
      nullable: true,
      default: "preserve",
    },
    "mapping-direction": {
      type: "string",
      enum: ["to", "from"],
      nullable: true,
      default: "from",
    },
  },
  required: ["mapping-targets"],
};

export const $lib = createTypeSpecLibrary({
  name: "form-library-xml",
  diagnostics: {
    "mapping-target-unknown": {
      severity: "error",
      messages: {
        default: paramMessage`mapping-targets names "${"name"}", which is not a member of any enum declared with @Mapping.targets (members: ${"members"}).`,
      },
    },
    "xml-transform-collision": {
      severity: "error",
      messages: {
        default: paramMessage`Form ${"form"} is linked in both ${"first"} and ${"second"}, but writes one xml-transform.json. Configure mapping-targets with only one of them.`,
      },
    },
    "xml-wrappers-left-out": {
      severity: "warning",
      messages: {
        default: paramMessage`${"form"}'s rules leave out ${"count"} element(s) that wrap fields without a field of their own, which rules keyed by the response's properties cannot write: ${"elements"}.`,
      },
    },
    "xml-root-namespace-missing": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} is the root element of mapping ${"mapping"}, so it needs an @Xml.ns naming a member of an @Xml.nsDeclarations enum: that enum lists the namespaces the document declares.`,
      },
    },
    "xml-target-default-unsupported": {
      severity: "error",
      messages: {
        default:
          "Unmapped root XML defaults support string values only. Keep other values explicitly mapped rather than silently omitting them.",
      },
    },
    "xml-static-rule-collision": {
      severity: "error",
      messages: {
        default: paramMessage`XML metadata rule ${"name"} collides with a mapped response key. Rename the XML target property; no applicant answer may be shadowed.`,
      },
    },
  },
  emitter: { options: EmitterOptionsSchema },
  state: { xsd: {}, form: {} },
} as const);

export const { reportDiagnostic, stateKeys } = $lib;
