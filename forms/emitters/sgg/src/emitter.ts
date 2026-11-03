import type { EmitContext, Model } from "@typespec/compiler";
import { emitFile, resolvePath } from "@typespec/compiler";
import { formIdentities } from "form-library-xml";
import { allBlocks } from "simpler-forms";
import type { SggEmitterOptions } from "./lib.js";
import { modelSync, ruleSchema } from "./model.js";

/**
 * Writes what scripts/sync.mjs needs to install each form into the API: whether it is
 * installed and with its XML transform rules, and the Grants.gov identity it is registered
 * under. One sgg.json per form, and a rule-schema.json for a form with attachments,
 * beside the artifacts the `simpler-forms` and `form-library-xml` emitters write, so the
 * sync step reads files rather than the specification.
 */
export async function $onEmit(
  context: EmitContext<SggEmitterOptions>,
): Promise<void> {
  const { program, options } = context;
  const casing = options["property-casing"] ?? "preserve";
  if (program.compilerOptions.noEmit) return;

  const identities = formIdentities(program);
  for (const block of allBlocks(program)) {
    if (block.kind !== "form") continue;
    const model = block.model as Model;
    await emitFile(program, {
      path: resolvePath(context.emitterOutputDir, `forms/${block.id}/sgg.json`),
      content: `${JSON.stringify(
        {
          sync: modelSync(program, model) ?? false,
          grantsGov: identities.get(model) ?? null,
        },
        null,
        2,
      )}\n`,
    });
    const rules = ruleSchema(program, model, casing);
    if (Object.keys(rules).length)
      await emitFile(program, {
        path: resolvePath(
          context.emitterOutputDir,
          `forms/${block.id}/rule-schema.json`,
        ),
        content: `${JSON.stringify(rules, null, 2)}\n`,
      });
  }
}
