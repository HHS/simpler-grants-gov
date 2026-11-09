import {
  createTypeSpecLibrary,
  paramMessage,
  type JSONSchemaType,
} from "@typespec/compiler";

export interface SggEmitterOptions {
  /** Must match the `simpler-forms` emitter's, so rule schema keys name the schema's properties. */
  "property-casing"?: "preserve" | "snake";
}

/**
 * A TypeSpec library of its own, rather than a plugin registered with `simpler-forms`.
 *
 * The compiler already supports listing several libraries in `tspconfig.yaml`, each with
 * its own decorators, diagnostics, state and emitter, so a plugin interface in the core
 * would duplicate a mechanism that exists. It also keeps the dependency one-directional:
 * this package reads the core's public API and the core knows nothing about it.
 */
export const $lib = createTypeSpecLibrary({
  name: "simpler-forms-sgg",
  // Pins the diagnostic short name independent of the package name, so moving this
  // into an npm scope later leaves every `#suppress "sgg/<rule>"` working.
  alias: "sgg",
  diagnostics: {
    "sgg-not-a-form": {
      severity: "error",
      messages: {
        default: paramMessage`@Sgg.${"decorator"} applies to a form, and ${"name"} has no @Meta.form.`,
      },
    },
    "invalid-instructions": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} has @Sgg.sync instructions "${"value"}", which is not a UUID: it names the form instruction record the API serves.`,
      },
    },
    "sync-without-identity": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} has @Sgg.sync but no @GrantsGov.form, so it cannot be installed: the API registers a form under its Grants.gov short form name and version.`,
      },
    },
    "sync-xml-transform-incomplete": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} installs its XML as transform rules, which leave out ${"elements"}. Use @Sgg.sync(#{ xml: "mapping" }), which writes them.`,
      },
    },
  },
  state: {
    sync: {},
    attachment: {},
  },
  emitter: {
    options: {
      type: "object",
      additionalProperties: false,
      properties: {
        "property-casing": {
          type: "string",
          enum: ["preserve", "snake"],
          nullable: true,
          default: "preserve",
        },
      },
      required: [],
    } as JSONSchemaType<SggEmitterOptions>,
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;
