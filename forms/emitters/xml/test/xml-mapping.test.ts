import type { EnumMember, Model, Program } from "@typespec/compiler";
import { createTester, expectDiagnostics } from "@typespec/compiler/testing";
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

  @Mapping.transforms(Transformation)
  namespace Transforms { enum Transformation { yesNo: "boolean_to_yes_no" } }

  namespace Forms {
    @Meta.form(#{ id: "example", formName: "Example" })
    model Example { ${form} }
    model Race { name: string; }
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

  it("writes a list of values as one element per value", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "races?: string[]; disabled?: boolean[];",
      `@Mapping.from(xml, Forms.Example.races)
       @name("Race")
       race?: string[];

       @Mapping.from(xml, Forms.Example.disabled)
       @Mapping.transform(Transforms.Transformation.yesNo)
       @name("Disabled")
       disabled?: string[];`,
    );
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      Race: { $each: { items: { $field: "races" }, map: { $field: "." } } },
      Disabled: {
        $each: {
          items: { $field: "disabled" },
          map: {
            $transform: { name: "boolean_to_yes_no", value: { $field: "." } },
          },
        },
      },
    });
  });

  it("rejects a list of values filled from a list of objects", async () => {
    const { diagnostics } = await mappingOf(
      "races?: Race[];",
      `@Mapping.from(xml, Forms.Example.races) @name("Race") race?: string[];`,
    );
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/xml-mapping-unsupported",
      message:
        "The XML mapping can't write Race yet: it holds a list of values filled from a list of objects.",
    });
  });
});
