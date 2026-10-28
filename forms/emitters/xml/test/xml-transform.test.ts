import type { EnumMember, Model, Program } from "@typespec/compiler";
import { compile, NodeHost } from "@typespec/compiler";
import { createTester, expectDiagnostics } from "@typespec/compiler/testing";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { xmlTransform } from "../src/xml-transform.js";

const FORMS_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

/**
 * Each fixture is the form's hand-written mapping in
 * `simpler-grants-gov/forms/specs/xml/<form>.json`, less the `_xml_config` keys the API never
 * reads (`description`, `version`, `null_handling_options`). The rules are read from the
 * `@Mapping.from` links on the XSD TypeSpec models.
 */
describe.each(["key-contacts", "epa-key-contacts", "performance-sites"])(
  "%s fixture",
  (form) => {
    it("emits the hand-written mapping", async () => {
      const outputDir = await mkdtemp(path.join(tmpdir(), "form-library-xml-"));
      const program = await compile(
        NodeHost,
        path.join(FORMS_ROOT, "specs/main.tsp"),
        {
          emit: ["form-library-xml"],
          options: {
            "form-library-xml": {
              "emitter-output-dir": outputDir,
              "mapping-targets": ["grantsGovXml"],
              "property-casing": "snake",
            },
          },
        },
      );
      expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual(
        [],
      );

      const read = async (file: string) =>
        JSON.parse(await readFile(file, "utf8")) as unknown;
      expect(
        await read(path.join(outputDir, `forms/${form}/xml-transform.json`)),
      ).toEqual(
        await read(
          fileURLToPath(
            new URL(`fixtures/${form}.xml-transform.json`, import.meta.url),
          ),
        ),
      );
    });
  },
);

// ---------------------------------------------------------------------------

const Tester = createTester(FORMS_ROOT, {
  libraries: ["simpler-forms", "@typespec/xml", "form-library-xml"],
});

/**
 * Two mappings, an XSD TypeSpec model as the target of the first and a column layout as
 * the second's. Sources are written in an order the XSD model does not use, so ordering is
 * visible.
 */
const spec = (body: string) => `
  import "simpler-forms";
  import "@typespec/xml";
  import "form-library-xml";
  using SimplerForms;
  using TypeSpec.Xml;

  @Mapping.targets(Target)
  namespace Mappings { enum Target { xml, xmlNext, csv } }

  namespace Wire {
    @nsDeclarations
    enum Ns { Form: "http://example.gov/form", lib: "http://example.gov/lib" }

    @ns(Ns.lib)
    model Name { @name("First") first: string; @name("Last") last: string; }

    @ns(Ns.Form)
    model Person {
      @name("PersonName") personName: Name;
      @name("Phone") phone: string;
      @name("Email") email?: string;
    }

    @name("FormRoot")
    @ns(Ns.Form)
    @GrantsGov.xsd("http://example.gov/form.xsd")
    model Root {
      @name("Title") title: string;
      @name("People") people: Person[];
      @ns(Ns.lib) @name("Note") note?: string;
      @attribute @name("FormVersion") formVersion: "1.0";
    }
  }

  namespace Flat { model Row { titleColumn: string; } }

  namespace Forms { ${body} }
`;

const FORM = `
  @Mapping.to(Mappings.Target.xml, Wire.Name)
  model PersonName {
    @Mapping.to(Mappings.Target.xml, Wire.Name.last) lastName: string;
    @Mapping.to(Mappings.Target.xml, Wire.Name.first) firstName: string;
  }
  model Reach { email?: string; phone?: string; }

  @Mapping.to(Mappings.Target.xml, Wire.Person)
  @Mapping.path(Mappings.Target.xml, "reach.phone", Wire.Person.phone)
  @Mapping.path(Mappings.Target.xml, "reach.email", Wire.Person.email)
  model Contact {
    reach: Reach;
    @Mapping.to(Mappings.Target.xml, Wire.Person.personName) name: PersonName;
  }

  @Meta.form(#{ id: "example", formName: "Example" })
  @Mapping.to(Mappings.Target.xml, Wire.Root)
  @Mapping.to(Mappings.Target.csv, Flat.Row)
  @Mapping.to(Mappings.Target.xmlNext, Wire.Root)
  model Example {
    @Mapping.to(Mappings.Target.xml, Wire.Root.note) footNote?: string;
    @Mapping.to(Mappings.Target.xml, Wire.Root.people) contacts: Contact[];
    @Mapping.to(Mappings.Target.xml, Wire.Root.title)
    @Mapping.to(Mappings.Target.csv, Flat.Row.titleColumn)
    formTitle: string;
  }
`;

const rules = async (mapping = "xml") => {
  const { program } = await Tester.compile(spec(FORM));
  return xmlTransform(
    program,
    lookup<Model>(program, "Forms.Example"),
    lookup<EnumMember>(program, `Mappings.Target.${mapping}`),
    "snake",
    "to",
  );
};

function lookup<T>(program: Program, reference: string): T {
  const [type] = program.resolveTypeReference(reference);
  if (!type) throw new Error(`no ${reference}`);
  return type as T;
}

describe("xmlTransform", () => {
  it("describes the document from the root's XSD model", async () => {
    expect((await rules())?._xml_config).toEqual({
      form_name: "Form",
      namespaces: {
        default: "http://example.gov/form",
        Form: "http://example.gov/form",
        lib: "http://example.gov/lib",
      },
      xsd_url: "http://example.gov/form.xsd",
      xml_structure: {
        root_element: "FormRoot",
        root_namespace_prefix: "Form",
        root_attributes: { FormVersion: "1.0" },
      },
    });
  });

  it("orders rules by the XSD model's sequence, not the form's", async () => {
    const result = (await rules())!;
    expect(Object.keys(result)).toEqual([
      "_xml_config",
      "form_title",
      "contacts",
      "foot_note",
    ]);
    const items = (result.contacts as { items: Record<string, unknown> }).items;
    // `reach` is a group: it sits where its first child, Phone, does -- after PersonName.
    expect(Object.keys(items)).toEqual(["name", "reach"]);
    expect(Object.keys(items.reach as object)).toEqual(["phone", "email"]);
    expect(Object.keys(items.name as object)).toEqual([
      "xml_transform",
      "first_name",
      "last_name",
    ]);
  });

  it("writes each kind of link as the rule the API reads", async () => {
    const result = (await rules())!;
    expect(result.form_title).toEqual({ xml_transform: { target: "Title" } });
    expect(result.foot_note).toEqual({
      xml_transform: { target: "Note", namespace: "lib" },
    });
    expect(result.contacts).toEqual({
      xml_transform: { target: "People", type: "array" },
      items: {
        name: {
          xml_transform: { target: "PersonName", type: "nested_object" },
          first_name: { xml_transform: { target: "First", namespace: "lib" } },
          last_name: { xml_transform: { target: "Last", namespace: "lib" } },
        },
        reach: {
          phone: { xml_transform: { target: "Phone" } },
          email: { xml_transform: { target: "Email" } },
        },
      },
    });
  });

  it("is undefined for a mapping whose target is not an XSD model", async () => {
    // The csv links exist, but Flat.Row has no @Xml.ns, so there is no document to describe.
    const { program } = await Tester.compile(spec(FORM));
    const result = xmlTransform(
      program,
      lookup<Model>(program, "Forms.Example"),
      lookup<EnumMember>(program, "Mappings.Target.csv"),
      "snake",
      "to",
    );
    expect(result).toBeUndefined();
    expectDiagnostics(program.diagnostics, {
      code: "form-library-xml/xml-root-namespace-missing",
    });
  });
});

/**
 * A root with a transformed element and an attachment. `transform` names the
 * `@Mapping.transform` argument, so a test can name one no enum declares.
 */
const valueSpec = (transform = "Transforms.Transformation.yesNo") => `
  import "simpler-forms";
  import "@typespec/xml";
  import "form-library-xml";
  using SimplerForms;
  using TypeSpec.Xml;

  @Mapping.targets(Target)
  namespace Mappings { enum Target { xml } }

  @Mapping.transforms(Transformation)
  namespace Transforms {
    enum Transformation { yesNo: "boolean_to_yes_no", truncate: "truncate_string" }
  }
  namespace Undeclared { enum Transformation { shout } }

  namespace Wire {
    @nsDeclarations
    enum Ns { Form: "http://example.gov/form" }

    @GrantsGov.attachment
    scalar AttachedFile extends string;

    @name("FormRoot")
    @ns(Ns.Form)
    model Root {
      @Mapping.transform(${transform}) @name("Agrees") agrees: string;
      @Mapping.transform(Transforms.Transformation.truncate, #{ max_length: 60 })
      @name("Title") title?: string;
      @name("File") file?: AttachedFile;
    }
  }

  namespace Forms {
    @Meta.form(#{ id: "example", formName: "Example" })
    @Mapping.to(Mappings.Target.xml, Wire.Root)
    model Example {
      @Mapping.to(Mappings.Target.xml, Wire.Root.agrees) agrees: boolean;
      @Mapping.to(Mappings.Target.xml, Wire.Root.title) title?: string;
      @Mapping.to(Mappings.Target.xml, Wire.Root.file) upload?: string;
    }
  }
`;

const valueRules = async (transform?: string) => {
  const { program } = await Tester.compile(valueSpec(transform));
  const result = xmlTransform(
    program,
    lookup<Model>(program, "Forms.Example"),
    lookup<EnumMember>(program, "Mappings.Target.xml"),
    "snake",
    "to",
  );
  return { program, result: result! };
};

describe("xmlTransform values", () => {
  it("writes @Mapping.transform as the element's value_transform", async () => {
    const { result } = await valueRules();
    expect(result.agrees).toEqual({
      xml_transform: {
        target: "Agrees",
        value_transform: { type: "boolean_to_yes_no" },
      },
    });
  });

  it("writes @Mapping.transform's params as the value_transform's", async () => {
    const { result } = await valueRules();
    expect(result.title).toEqual({
      xml_transform: {
        target: "Title",
        value_transform: {
          type: "truncate_string",
          params: { max_length: 60 },
        },
      },
    });
  });

  it("rejects a transformation no @Mapping.transforms enum declares", async () => {
    const { program } = await valueRules("Undeclared.Transformation.shout");
    expectDiagnostics(program.diagnostics, {
      code: "form-library-xml/mapping-transform-unknown",
    });
  });

  it("writes a root attachment as an attachment field, not a rule", async () => {
    const { result } = await valueRules();
    expect(result.upload).toBeUndefined();
    expect(
      (result._xml_config as Record<string, unknown>).attachment_fields,
    ).toEqual({
      upload: {
        xml_element: "File",
        type: "single_with_wrapper",
        file_element: "",
      },
    });
  });
});

describe("$onEmit", () => {
  it("rejects a mapping-targets member no enum declares", async () => {
    const diagnostics = await Tester.emit("form-library-xml", {
      "mapping-targets": ["nope"],
    }).diagnose(spec(FORM));
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/mapping-target-unknown",
    });
  });

  it("rejects two mappings that would write one form's file", async () => {
    const diagnostics = await Tester.emit("form-library-xml", {
      "mapping-targets": ["xml", "xmlNext"],
      "mapping-direction": "to",
    }).diagnose(spec(FORM));
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/xml-transform-collision",
    });
  });
});
