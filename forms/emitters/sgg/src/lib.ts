import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

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
    "sync-without-identity": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} has @Sgg.sync but no @GrantsGov.form, so it cannot be installed: the API registers a form under its Grants.gov short form name and version.`,
      },
    },
  },
  state: {
    sync: {},
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;
