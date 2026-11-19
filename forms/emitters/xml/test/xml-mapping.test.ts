import { fileURLToPath } from "node:url";
import type { EnumMember, Model, Program } from "@typespec/compiler";
import { createTester, expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";

import { generateXml } from "../src/runtime/index.js";
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
  namespace Transforms {
    enum Transformation {
      yesNo: "boolean_to_yes_no",
      truncate: "truncate_string",
    }
  }

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

  it("passes @Mapping.transform's params to the transform", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "title?: string;",
      `@Mapping.from(xml, Forms.Example.title)
       @Mapping.transform(Transforms.Transformation.truncate, #{ max_length: 60 })
       @name("Title")
       title?: string;`,
    );
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      Title: {
        $transform: {
          name: "truncate_string",
          value: { $field: "title" },
          params: { max_length: 60 },
        },
      },
    });
  });
});

const errors = (diagnostics: readonly { severity: string }[]) =>
  diagnostics.filter((d) => d.severity === "error");

describe("@Mapping.from() with Mapping.Item<> and Mapping.Slice<>", () => {
  it("writes each item as a separate, numbered XML element", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "types?: string[];",
      `@Mapping.from(xml, Mapping.Item<Forms.Example.types, 0>)
       @name("ApplicantTypeCode1") code1?: string;
       @Mapping.from(xml, Mapping.Item<Forms.Example.types, 1>)
       @name("ApplicantTypeCode2") code2?: string;`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      ApplicantTypeCode1: { $field: "types[0]" },
      ApplicantTypeCode2: { $field: "types[1]" },
    });
  });

  it("writes first item as its own XML element and the rest as a list", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "sites?: Race[]; attachments?: string[];",
      `@Mapping.from(xml, Mapping.Item<Forms.Example.sites, 0>)
       @name("PrimarySite") primary?: Site;
       @Mapping.from(xml, Mapping.Slice<Forms.Example.sites, 1>)
       @name("OtherSite") others?: Site[];
       @Mapping.from(xml, Mapping.Item<Forms.Example.attachments, 0>)
       @name("ATT1") att1?: AttachedFile;
       @Mapping.from(xml, Mapping.Slice<Forms.Example.attachments, 1, 3>)
       @name("ATT") rest?: AttachedFile[];`,
      `@ns(Ns.Form)
       model Site {
         @Mapping.from(xml, Forms.Race.name) @name("Name") name?: string;
       }`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      PrimarySite: { Name: { $field: "sites[0].name" } },
      OtherSite: {
        $each: {
          items: { $field: "sites[1:]" },
          map: { Name: { $field: "name" } },
        },
      },
      ATT1: { $attachment: "attachments[0]" },
      ATT: {
        $each: {
          items: { $field: "attachments[1:3]" },
          map: { $attachment: "." },
        },
      },
    });
  });
});

describe("@Mapping.from() on an element with a single value", () => {
  it.each([
    ["an object field", "Forms.Example.person"],
    ["an item of a list of objects", "Mapping.Item<Forms.Example.people, 0>"],
  ])("reports an error when the element reads %s", async (_source, source) => {
    const { diagnostics } = await mappingOf(
      "person?: Race; people?: Race[];",
      `@Mapping.from(xml, ${source}) @name("Name") name?: string;`,
    );
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/xml-mapping-object-into-value",
      severity: "error",
    });
  });

  it("reports an error when an attribute reads an object field", async () => {
    const { diagnostics } = await mappingOf(
      "person?: Race;",
      `@Mapping.from(xml, Forms.Example.person) @attribute @name("Who") who?: string;`,
    );
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/xml-mapping-object-into-value",
      message:
        "@Form:Who is a single value, but its @Mapping.from reads person, which is a Race object. Name a field of Race instead.",
    });
  });

  it("writes an item of a list of values", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "places?: string[];",
      `@Mapping.from(xml, Mapping.Item<Forms.Example.places, 2>)
       @name("PlaceofPerformance3") place3?: string;`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      PlaceofPerformance3: { $field: "places[2]" },
    });
  });
});

describe("@Mapping.match()", () => {
  it("looks up the answer in the cases, and writes the answer itself when no case matches", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "types?: string[];",
      `@Mapping.from(xml, Mapping.Item<Forms.Example.types, 0>)
       @Mapping.match(#{ \`H: state\`: "H: State" }, Forms.Example.types)
       @name("ApplicantTypeCode1") code1?: string;`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      ApplicantTypeCode1: {
        $match: {
          value: { $field: "types[0]" },
          case: { "H: state": "H: State" },
          default: { $field: "types[0]" },
        },
      },
    });
  });
});

describe("@Mapping.required", () => {
  it("writes an empty element when the field isn't answered", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "dateReceived?: string;",
      `@Mapping.from(xml, Forms.Example.dateReceived) @Mapping.required
       @name("DateReceived") dateReceived?: string;`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      DateReceived: { $required: { $field: "date_received" } },
    });
    expect(generateXml(mapping!, {})).toContain("<Form:DateReceived/>");
  });

  it("leaves out an optional element whose list item is missing, instead of writing it empty", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "periods?: Race[];",
      `@Mapping.from(xml, Mapping.Item<Forms.Example.periods, 1>)
       @name("BudgetYear2") year2?: Year;`,
      `@ns(Ns.Form)
       model Year {
         @Mapping.from(xml, Forms.Race.name) @Mapping.required
         @name("Total") total?: string;
       }`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot).toEqual({
      BudgetYear2: {
        $when: {
          condition: { field: "periods[1]", operator: "exists" },
          then: { Total: { $required: { $field: "periods[1].name" } } },
        },
      },
    });
    const xml = generateXml(mapping!, { periods: [{ name: "100" }] });
    expect(xml).not.toContain("BudgetYear2");
  });
});

describe("@Mapping.when()", () => {
  const revision = async () =>
    mappingOf(
      "applicationType?: string; revisionCode?: string; explanation?: string;",
      `@Mapping.from(xml, Forms.Example.revisionCode)
       @Mapping.when(Forms.Example.applicationType, Operator.equals, "Revision")
       @name("RevisionCode") code?: string;
       @Mapping.from(xml, Forms.Example.explanation)
       @Mapping.when(Forms.Example.applicationType, Operator.equals, "Revision")
       @Mapping.when(Forms.Example.revisionCode, Operator.equals, "E")
       @name("RevisionCodeOtherExplanation") explanation?: string;`,
    );

  it("writes an element only while all its conditions are true", async () => {
    const { mapping, diagnostics } = await revision();
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot.RevisionCodeOtherExplanation).toEqual({
      $when: {
        condition: {
          all: [
            {
              field: "application_type",
              operator: "equals",
              value: "Revision",
            },
            { field: "revision_code", operator: "equals", value: "E" },
          ],
        },
        then: { $field: "explanation" },
      },
    });
  });

  it("leaves answers that no longer apply out of the XML without removing them from the draft", async () => {
    const { mapping } = await revision();
    const draft = {
      application_type: "New",
      revision_code: "E",
      explanation: "Changed scope",
    };
    const kept = structuredClone(draft);
    const elements = (response: object) =>
      ["RevisionCode", "RevisionCodeOtherExplanation"].filter((name) =>
        generateXml(mapping!, response).includes(`<Form:${name}>`),
      );

    expect(elements(draft)).toEqual([]);
    expect(
      elements({
        ...draft,
        application_type: "Revision",
        revision_code: "AC",
      }),
    ).toEqual(["RevisionCode"]);
    expect(elements({ ...draft, application_type: "Revision" })).toEqual([
      "RevisionCode",
      "RevisionCodeOtherExplanation",
    ]);
    expect(draft).toEqual(kept);
  });

  it("writes a wrapper element and its attribute only while its condition is true", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "reportType?: string; changeYear?: string; lastReportDate?: string;",
      `@Mapping.when(Forms.Example.reportType, Operator.equals, "MaterialChange")
       @name("MaterialChangeSupplement") supplement?: Supplement;`,
      `@ns(Ns.Form)
       model Supplement {
         @attribute @name("ReportType") reportType: "MaterialChange";
         @Mapping.from(xml, Forms.Example.changeYear)
         @name("MaterialChangeYear") year?: string;
         @Mapping.from(xml, Forms.Example.lastReportDate)
         @name("LastReportDate") lastReportDate?: string;
       }`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot.MaterialChangeSupplement).toEqual({
      $when: {
        condition: {
          field: "report_type",
          operator: "equals",
          value: "MaterialChange",
        },
        then: {
          "@Form:ReportType": { $const: "MaterialChange" },
          MaterialChangeYear: { $field: "change_year" },
          LastReportDate: { $field: "last_report_date" },
        },
      },
    });

    const answers = { change_year: "2026", last_report_date: "2026-06-30" };
    expect(
      generateXml(mapping!, { ...answers, report_type: "MaterialChange" }),
    ).toContain(
      '<Form:MaterialChangeSupplement Form:ReportType="MaterialChange">',
    );
    expect(
      generateXml(mapping!, { ...answers, report_type: "InitialFiling" }),
    ).not.toContain("MaterialChangeSupplement");
  });

  it("writes an element filled from an object only while its condition is true", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "hasPartner?: boolean; partner?: Race;",
      `@Mapping.from(xml, Forms.Example.partner)
       @Mapping.when(Forms.Example.hasPartner, Operator.equals, true)
       @name("Partner") partner?: Partner;`,
      `@ns(Ns.Form)
       model Partner {
         @Mapping.from(xml, Forms.Race.name) @name("Name") name?: string;
       }`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot.Partner).toEqual({
      $when: {
        condition: { field: "has_partner", operator: "equals", value: true },
        then: { Name: { $field: "partner.name" } },
      },
    });

    const partner = { name: "Partner Org" };
    expect(generateXml(mapping!, { has_partner: true, partner })).toContain(
      "<Form:Partner>",
    );
    expect(
      generateXml(mapping!, { has_partner: false, partner }),
    ).not.toContain("Partner");
  });

  it("writes a list only while its condition is true", async () => {
    const { mapping, diagnostics } = await mappingOf(
      "hasSites?: boolean; sites?: Race[];",
      `@Mapping.from(xml, Forms.Example.sites)
       @Mapping.when(Forms.Example.hasSites, Operator.equals, true)
       @name("Site") sites?: Site[];`,
      `@ns(Ns.Form)
       model Site {
         @Mapping.from(xml, Forms.Race.name) @name("Name") name?: string;
       }`,
    );
    expect(errors(diagnostics)).toEqual([]);
    expect(mapping?.root.FormRoot.Site).toEqual({
      $when: {
        condition: { field: "has_sites", operator: "equals", value: true },
        then: {
          $each: {
            items: { $field: "sites" },
            map: { Name: { $field: "name" } },
          },
        },
      },
    });

    const sites = [{ name: "Main" }, { name: "Annex" }];
    expect(
      generateXml(mapping!, { has_sites: true, sites }).match(/<Form:Site>/g),
    ).toHaveLength(2);
    expect(generateXml(mapping!, { has_sites: false, sites })).not.toContain(
      "Site",
    );
  });

  it("reports an error when a condition names a field outside the element's scope", async () => {
    const { diagnostics } = await mappingOf(
      "hasSites?: boolean; sites?: Race[];",
      `@Mapping.from(xml, Forms.Example.sites) @name("Site") sites?: Site[];`,
      `@ns(Ns.Form)
       model Site {
         @Mapping.from(xml, Forms.Race.name)
         @Mapping.when(Forms.Example.hasSites, Operator.equals, true)
         @name("Name") name?: string;
       }`,
    );
    expectDiagnostics(diagnostics, {
      code: "form-library-xml/xml-mapping-field-out-of-scope",
      message:
        "A @Mapping.when or @Mapping.match on Name names hasSites, which isn't in Race: the model that Name reads its fields from. Name a field of Race, or of an object property of it. Inside a list, that's the list item.",
    });
  });
});
