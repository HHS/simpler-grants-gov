import type { EnumMember, Model, Program } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { xmlMapping } from "../src/xml-mapping.js";

const FORMS_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const Tester = createTester(FORMS_ROOT, {
  libraries: ["simpler-forms", "@typespec/xml", "form-library-xml"],
});

/**
 * A form, and an XSD TypeSpec model whose root reads it with `@Mapping.from`. `form` is the
 * form's properties; `root` the root's elements, and `models` any models they use.
 */
const spec = (form: string, root: string, models = "") => `
  import "simpler-forms";
  import "@typespec/xml";
  import "form-library-xml";
  using SimplerForms;
  using TypeSpec.Xml;

  @Mapping.targets(Target)
  namespace Mappings { enum Target { xml } }

  namespace Forms {
    @Meta.form(#{ id: "example", formName: "Example" })
    model Example { ${form} }
  }

  namespace Wire {
    alias xml = Mappings.Target.xml;

    @nsDeclarations
    enum Ns { Form: "http://example.gov/form" }

    @GrantsGov.attachment
    scalar AttachedFile extends string;

    ${models}

    @name("FormRoot")
    @ns(Ns.Form)
    @Mapping.from(xml, Forms.Example)
    model Root { ${root} }
  }
`;

const mappingOf = async (form: string, root: string, models?: string) => {
  const [{ program }] = await Tester.compileAndDiagnose(
    spec(form, root, models),
  );
  const mapping = xmlMapping(
    program,
    lookup<Model>(program, "Forms.Example"),
    lookup<EnumMember>(program, "Mappings.Target.xml"),
    "snake",
  );
  // The program's diagnostics include those `xmlMapping` reports.
  return { mapping, diagnostics: program.diagnostics };
};

function lookup<T>(program: Program, reference: string): T {
  const [type] = program.resolveTypeReference(reference);
  if (!type) throw new Error(`no ${reference}`);
  return type as T;
}

describe("xmlMapping", () => {
  it("writes a list of upload ids as one attachment per id", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "otherAttachments?: string[];",
      `@name("OtherAttachments") others?: Others;`,
      `@ns(Ns.Form)
       model Others {
         @Mapping.from(xml, Forms.Example.otherAttachments)
         @name("OtherAttachment")
         other?: AttachedFile[];
       }`,
    );
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      OtherAttachments: {
        OtherAttachment: {
          $each: {
            items: { $field: "other_attachments" },
            map: { $attachment: "." },
          },
        },
      },
    });
  });
});
