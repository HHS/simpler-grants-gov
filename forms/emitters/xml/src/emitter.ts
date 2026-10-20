import type { EmitContext, Model } from "@typespec/compiler";
import { emitFile, resolvePath } from "@typespec/compiler";
import { mappingTargets, resolveForms } from "./simpler-forms.js";
import { reportDiagnostic, type XmlEmitterOptions } from "./lib.js";
import { xmlTransform } from "./xml-transform.js";

/**
 * Writes Grants.gov XML transform rules -- the `xml_transform.json` the API's XML generation
 * reads -- for every form linked in a configured mapping, beside the form's other artifacts:
 *
 *   forms/<form id>/xml-transform.json
 *
 * Point `emitter-output-dir` at the `simpler-forms` emitter's to keep a form's artifacts in
 * one directory. One file per form, so a form linked in two configured mappings is an error.
 */
export async function $onEmit(
  context: EmitContext<XmlEmitterOptions>,
): Promise<void> {
  const { program, options } = context;
  const casing = options["property-casing"] ?? "preserve";
  const direction = options["mapping-direction"] ?? "from";
  const declared = mappingTargets(program);
  const emitted = new Map<Model, string>();

  for (const name of options["mapping-targets"]) {
    const mapping = declared.find((member) => member.name === name);
    if (!mapping) {
      reportDiagnostic(program, {
        code: "mapping-target-unknown",
        target: program.getGlobalNamespaceType(),
        format: {
          name,
          members: declared.map((m) => m.name).join(", ") || "none",
        },
      });
      continue;
    }
    if (program.compilerOptions.noEmit) continue;

    for (const form of resolveForms(program).forms) {
      const { model } = form;
      const rules = xmlTransform(program, model, mapping, casing, direction);
      if (!rules) continue;
      const first = emitted.get(model);
      if (first) {
        reportDiagnostic(program, {
          code: "xml-transform-collision",
          target: model,
          format: { form: form.id, first, second: name },
        });
        continue;
      }
      emitted.set(model, name);
      await emitFile(program, {
        path: resolvePath(
          context.emitterOutputDir,
          `forms/${form.id}/xml-transform.json`,
        ),
        content: `${JSON.stringify(rules, null, 2)}\n`,
      });
    }
  }
}
