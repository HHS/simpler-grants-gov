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
describe.each(["key-contacts", "epa-key-contacts"])("%s fixture", (form) => {
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
});

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

describe("root wire initialization", () => {
  const compileDefaults = async (declaration: string, form = FORM) => {
    const code = spec(form).replace(
      '@name("Title") title: string;',
      `${declaration}\n@name("Title") title: string = "Not an applicant default";`,
    );
    const { program } = await Tester.compile(code);
    const result = xmlTransform(
      program,
      lookup<Model>(program, "Forms.Example"),
      lookup<EnumMember>(program, "Mappings.Target.xml"),
      "snake",
      "to",
    )!;
    return { program, result };
  };

  it("uses the existing static-value rule with source order and namespace", async () => {
    const { program, result } = await compileDefaults(
      '@ns(Ns.lib) @name("Version") version: string = "1.1";',
    );
    expectDiagnostics(program.diagnostics, []);
    expect(Object.keys(result)).toEqual([
      "_xml_config",
      "xml_constant_version",
      "form_title",
      "contacts",
      "foot_note",
    ]);
    expect(result.xml_constant_version).toEqual({
      xml_transform: {
        target: "Version",
        static_value: "1.1",
        namespace: "lib",
      },
    });
    // A mapped property's default never shadows applicant data.
    expect(result.form_title).toEqual({ xml_transform: { target: "Title" } });
    expect(result).not.toHaveProperty("xml_constant_title");
    expect(result).toHaveProperty("_xml_config.xml_structure.root_attributes", {
      FormVersion: "1.0",
    });
  });

  it("preserves a source-permitted empty string rather than dropping it", async () => {
    const { result } = await compileDefaults('version: string = "";');
    expect(
      (result.xml_constant_version as any).xml_transform.static_value,
    ).toBe("");
  });

  it("initializes wire metadata through target-side from mappings", async () => {
    const { program } = await Tester.compile(`
      import "simpler-forms";
      import "@typespec/xml";
      import "form-library-xml";
      using SimplerForms;
      using TypeSpec.Xml;

      @Mapping.targets(Target)
      namespace Mappings { enum Target { xml } }

      namespace Forms {
        @Meta.form(#{ id: "example", formName: "Example" })
        model Example { title: string; }
      }

      namespace Wire {
        @nsDeclarations
        enum Ns { Form: "http://example.gov/form", global: "http://example.gov/global" }

        @name("FormRoot")
        @ns(Ns.Form)
        @Mapping.from(Mappings.Target.xml, Forms.Example)
        model Root {
          @ns(Ns.global) @name("FormVersionIdentifier")
          formVersionIdentifier: string = "1.1";

          @Mapping.from(Mappings.Target.xml, Forms.Example.title)
          @name("Title")
          title: string = "Never replace an applicant answer";

          @attribute @name("FormVersion") formVersion: "1.1";
        }
      }
    `);
    expectDiagnostics(program.diagnostics, []);
    const result = xmlTransform(
      program,
      lookup<Model>(program, "Forms.Example"),
      lookup<EnumMember>(program, "Mappings.Target.xml"),
      "snake",
      "from",
    )!;
    expect(Object.keys(result)).toEqual([
      "_xml_config",
      "xml_constant_form_version_identifier",
      "title",
    ]);
    expect(result.xml_constant_form_version_identifier).toEqual({
      xml_transform: {
        target: "FormVersionIdentifier",
        static_value: "1.1",
        namespace: "global",
      },
    });
    expect(result.title).toEqual({ xml_transform: { target: "Title" } });
    expect(result).not.toHaveProperty("xml_constant_title");
    expect(result).toHaveProperty("_xml_config.xml_structure.root_attributes", {
      FormVersion: "1.1",
    });
  });

  it("lets an explicitly mapped group own a defaulted target", async () => {
    const form =
      FORM.replace(
        "model Example {",
        '@Mapping.path(Mappings.Target.xml, "context.version", Wire.Root.version)\nmodel Example { context: Values;',
      ) + "\nmodel Values { version: string; }";
    const { result } = await compileDefaults('version: string = "1.1";', form);
    expect(result).not.toHaveProperty("xml_constant_version");
    expect(result.context).toEqual({
      version: { xml_transform: { target: "version" } },
    });
  });

  it.each([
    "version: int32 = 0;",
    "version: boolean = false;",
    "version: string | null = null;",
    'version: string[] = #["a"];',
    'version: { value: string } = #{ value: "a" };',
  ])("diagnoses unsupported initialization: %s", async (declaration) => {
    const { program } = await compileDefaults(declaration);
    expect(program.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "form-library-xml/xml-target-default-unsupported",
        severity: "error",
      }),
    );
  });

  it("diagnoses a transport-rule key collision instead of shadowing an answer", async () => {
    const { program, result } = await compileDefaults(
      'version: string = "1.1";',
      FORM.replace("formTitle: string;", "xmlConstantVersion: string;"),
    );
    expect(program.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "form-library-xml/xml-static-rule-collision",
        severity: "error",
      }),
    );
    expect(result.xml_constant_version).toEqual({
      xml_transform: { target: "Title" },
    });
  });
});
