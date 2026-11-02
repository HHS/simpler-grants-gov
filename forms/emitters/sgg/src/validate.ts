import type { Model, Program } from "@typespec/compiler";
import { formIdentities } from "form-library-xml";
import { readBlock } from "simpler-forms";
import { reportDiagnostic, stateKeys } from "./lib.js";
import { modelSync } from "./model.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `@Sgg.sync` installs a form, so it belongs on a model with `@Meta.form`, and that form
 * needs the Grants.gov identity the API registers it under. Read from the state map rather
 * than `allBlocks`, because a model that is neither a question nor a form is not a block.
 */
export function $onValidate(program: Program): void {
  const identities = formIdentities(program);
  for (const target of program.stateMap(stateKeys.sync).keys()) {
    const model = target as Model;
    if (readBlock(program, model)?.kind !== "form") {
      reportDiagnostic(program, {
        code: "sgg-not-a-form",
        target: model,
        format: { decorator: "sync", name: model.name },
      });
      continue;
    }
    if (!identities.has(model))
      reportDiagnostic(program, {
        code: "sync-without-identity",
        target: model,
        format: { name: model.name },
      });
    const { instructions } = modelSync(program, model)!;
    if (instructions !== undefined && !UUID.test(instructions))
      reportDiagnostic(program, {
        code: "invalid-instructions",
        target: model,
        format: { name: model.name, value: instructions },
      });
  }
}
