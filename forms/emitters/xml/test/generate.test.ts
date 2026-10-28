import { compile, NodeHost } from "@typespec/compiler";
import Ajv from "ajv/dist/2020.js";
import { readdir } from "node:fs/promises";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  generateXml,
  type AttachmentInfo,
  type XmlMapping,
} from "../src/runtime/index.js";

const FORMS_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

let outputDir: string;

beforeAll(async () => {
  outputDir = await mkdtemp(path.join(tmpdir(), "form-library-xml-"));
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
  expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
}, 60_000);

const mappingOf = async (form: string) =>
  JSON.parse(
    await readFile(
      path.join(outputDir, `forms/${form}/xml-mapping.json`),
      "utf8",
    ),
  ) as XmlMapping;

const fixture = (name: string) =>
  readFile(fileURLToPath(new URL(`fixtures/${name}`, import.meta.url)), "utf8");

const schemaValidator = async () =>
  new Ajv().compile(
    JSON.parse(
      await readFile(
        fileURLToPath(
          new URL("../schema/xml-mapping.schema.json", import.meta.url),
        ),
        "utf8",
      ),
    ),
  );

/** Expect `mapping` to match schema/xml-mapping.schema.json. */
const expectValid = async (mapping: XmlMapping) => {
  const validate = await schemaValidator();
  validate(mapping);
  expect(validate.errors ?? []).toEqual([]);
};

const ADDITIONAL_LOCATIONS = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const ADDITIONAL_LOCATIONS_FILE: AttachmentInfo = {
  fileName: "additional_locations.pdf",
  mimeType: "application/pdf",
  fileLocation: "additional_locations.pdf",
  hashValue: "aeB1+6gdFwih51ijIRn3b8QYn24=",
};

/**
 * Each fixture is the API's snapshot for the hand-written form, in
 * `api/tests/src/services/xml_generation/snapshots/`, and each response the data that test
 * generates it from. The emitted mapping writes the same document.
 */
describe("generateXml", () => {
  it("writes the API's Key Contacts snapshot", async () => {
    const xml = generateXml(await mappingOf("key-contacts"), {
      applicant_organization_name: "Acme Corporation",
      key_contacts: [
        {
          project_role: "Principal Investigator",
          name: { prefix: "Dr.", first_name: "Jane", last_name: "Smith" },
          title: "Senior Researcher",
          address: {
            street1: "123 Main Street",
            city: "Washington",
            state: "DC: District of Columbia",
            zip_code: "20001",
            country: "USA: UNITED STATES",
          },
          phone: "2025550100",
          email: "jane.smith@acme.org",
        },
      ],
    });
    expect(xml).toEqual(await fixture("key-contacts.xml"));
  });

  it("writes the API's Performance Sites snapshot", async () => {
    const usSite = {
      submitting_as_individual: false,
      organization_name: "Example University",
      uei: "ABCDEFGHIJ12",
      address: {
        street1: "123 Research Blvd",
        street2: "Suite 400",
        city: "Science City",
        county: "Grant County",
        state: "CA: California",
        country: "USA: UNITED STATES",
        zip_code: "90210-1234",
      },
      congressional_district: "CA-033",
    };
    const internationalSite = {
      submitting_as_individual: false,
      organization_name: "International Research Institute",
      address: {
        street1: "10 Rue de la Paix",
        city: "Paris",
        country: "FRA: FRANCE",
      },
    };
    const individualSite = {
      submitting_as_individual: true,
      address: {
        street1: "456 Main St",
        city: "Springfield",
        country: "USA: UNITED STATES",
        zip_code: "12345-6789",
        state: "IL: Illinois",
      },
      congressional_district: "IL-013",
    };
    const xml = generateXml(
      await mappingOf("performance-sites"),
      {
        primary_site: usSite,
        additional_sites: [internationalSite, individualSite],
        additional_locations_attachment: ADDITIONAL_LOCATIONS,
      },
      {
        attachment: (id) =>
          id === ADDITIONAL_LOCATIONS ? ADDITIONAL_LOCATIONS_FILE : undefined,
      },
    );
    expect(xml).toEqual(await fixture("performance-sites.xml"));
  });

  it("writes each person's attachments inside their profile", async () => {
    const person = (sketch: string) => ({
      name: { first_name: "Ada", last_name: "Lovelace" },
      address: {
        street1: "1 Main St",
        city: "Town",
        country: "USA: UNITED STATES",
      },
      phone: "2025550100",
      email: "ada@example.org",
      project_role: "PD/PI",
      biographical_sketch: sketch,
    });
    const xml = generateXml(
      await mappingOf("rr-key-person"),
      {
        principal_investigator: person("pi"),
        senior_key_persons: [person("kp")],
      },
      {
        attachment: (id) => ({
          fileName: `${id}.pdf`,
          mimeType: "application/pdf",
          fileLocation: `${id}.pdf`,
          hashValue: "hash",
        }),
      },
    );
    expect(xml).toMatch(
      /<RR_KeyPerson_3_0:KeyPerson>\s*<RR_KeyPerson_3_0:Profile>[\s\S]*<RR_KeyPerson_3_0:BioSketchsAttached>\s*<RR_KeyPerson_3_0:BioSketchAttached>\s*<att:FileName>kp\.pdf<\/att:FileName>/,
    );
    expect(xml).toContain("<att:FileName>pi.pdf</att:FileName>");
  });

  it("leaves out elements with nothing to write", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Wrapper: { Inner: { $field: "missing" } },
          Present: { $field: "here" },
        },
      },
    };
    expect(generateXml(mapping, { here: "yes" })).toEqual(
      `<?xml version='1.0' encoding='utf-8'?>\n<f:Root xmlns:f="urn:f">\n  <f:Present>yes</f:Present>\n</f:Root>`,
    );
  });

  it("writes `then` or `else` as `when`'s condition holds", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Kind: {
            $when: {
              condition: { field: "type", operator: "equals", value: "a" },
              then: { $const: "Alpha" },
              else: { $const: "Other" },
            },
          },
        },
      },
    };
    expect(generateXml(mapping, { type: "a" })).toContain(
      "<f:Kind>Alpha</f:Kind>",
    );
    expect(generateXml(mapping, { type: "b" })).toContain(
      "<f:Kind>Other</f:Kind>",
    );
  });

  it("writes the `case` entry a value matches, keyed as JSON writes it", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Individual: {
            $match: {
              value: { $field: "individual" },
              case: { true: "Y: Yes", false: "N: No" },
            },
          },
          Kind: {
            $match: {
              value: { $field: "kind" },
              case: { a: "A" },
              default: "Other",
            },
          },
        },
      },
    };
    const xml = generateXml(mapping, { individual: true, kind: "b" });
    expect(xml).toContain("<f:Individual>Y: Yes</f:Individual>");
    expect(xml).toContain("<f:Kind>Other</f:Kind>");
    expect(() =>
      generateXml(
        {
          ...mapping,
          root: {
            Root: { K: { $match: { value: { $field: "k" }, case: {} } } },
          },
        },
        { k: "x" },
      ),
    ).toThrow(/no case for x/);
  });

  it("nests functions: a case entry can be a $when or a group of elements", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Status: {
            $match: {
              value: { $field: "status" },
              case: {
                open: "Open",
                closed: {
                  $when: {
                    condition: { field: "reason", operator: "exists" },
                    then: { $field: "reason" },
                    else: "Closed",
                  },
                },
              },
            },
          },
          Applicant: {
            $match: {
              value: { $field: "kind" },
              case: { org: { Name: { $field: "organization" } } },
            },
          },
        },
      },
    };
    expect(generateXml(mapping, { status: "open" })).toContain(
      "<f:Status>Open</f:Status>",
    );
    expect(
      generateXml(mapping, { status: "closed", reason: "Withdrawn" }),
    ).toContain("<f:Status>Withdrawn</f:Status>");
    expect(generateXml(mapping, { status: "closed" })).toContain(
      "<f:Status>Closed</f:Status>",
    );
    expect(
      generateXml(mapping, {
        status: "open",
        kind: "org",
        organization: "Acme",
      }),
    ).toMatch(/<f:Applicant>\s*<f:Name>Acme<\/f:Name>/);
  });

  it("reads $each's list from any value", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Site: {
            $each: {
              items: {
                $when: {
                  condition: {
                    field: "has_sites",
                    operator: "equals",
                    value: true,
                  },
                  then: { $field: "sites" },
                },
              },
              map: { Name: { $field: "name" } },
            },
          },
        },
      },
    };
    const sites = [{ name: "A" }, { name: "B" }];
    expect(
      generateXml(mapping, { has_sites: true, sites }).match(/<f:Site>/g),
    ).toHaveLength(2);
    expect(generateXml(mapping, { has_sites: false, sites })).not.toContain(
      "Site",
    );
  });

  it("reads a list's entry by index, for numbered elements", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Type1: { $field: "types.0" },
          Type2: { $field: "types.1" },
          Type3: { $field: "types.2" },
          Count: { $field: "types.length" },
        },
      },
    };
    expect(generateXml(mapping, { types: ["A", "B"] })).toEqual(
      `<?xml version='1.0' encoding='utf-8'?>\n<f:Root xmlns:f="urn:f">\n  <f:Type1>A</f:Type1>\n  <f:Type2>B</f:Type2>\n</f:Root>`,
    );
  });

  it("writes a $required element empty when it has nothing to write", async () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          DateReceived: { $required: { $field: "date_received" } },
          Wrapper: { $required: { Inner: { $field: "inner" } } },
          "@f:Flag": { $required: { $field: "flag" } },
        },
      },
    };
    await expectValid(mapping);
    expect(generateXml(mapping, {})).toEqual(
      `<?xml version='1.0' encoding='utf-8'?>\n<f:Root xmlns:f="urn:f" f:Flag="">\n  <f:DateReceived/>\n  <f:Wrapper/>\n</f:Root>`,
    );
    expect(generateXml(mapping, { date_received: "2025-01-15" })).toContain(
      "<f:DateReceived>2025-01-15</f:DateReceived>",
    );
  });

  it("reads `.` as the item itself, for a list of upload ids", async () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          OtherAttachments: {
            OtherAttachment: {
              $each: {
                items: { $field: "other_attachments" },
                map: { $attachment: "." },
              },
            },
          },
          Code: {
            $each: { items: { $field: "codes" }, map: { $field: "." } },
          },
        },
      },
    };
    await expectValid(mapping);
    const xml = generateXml(
      mapping,
      { other_attachments: ["a", "b"], codes: ["X", "Y"] },
      {
        attachment: (id) => ({
          fileName: `${id}.pdf`,
          mimeType: "application/pdf",
          fileLocation: `${id}.pdf`,
          hashValue: "hash",
        }),
      },
    );
    expect(xml.match(/<f:OtherAttachment>/g)).toHaveLength(2);
    expect(xml.indexOf("a.pdf")).toBeLessThan(xml.indexOf("b.pdf"));
    expect(xml).toContain("<f:Code>X</f:Code>\n  <f:Code>Y</f:Code>");
  });

  it("writes one element per option a list `contains`, or does `not`", async () => {
    const option = (code: string) => ({
      $when: {
        condition: { field: "options", operator: "contains", value: code },
        then: "Y: Yes",
        else: "N: No",
      },
    });
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          OptionA: option("a"),
          OptionB: option("b"),
          NoneChosen: {
            $when: {
              condition: {
                not: { field: "options", operator: "exists" },
              },
              then: "Y: Yes",
            },
          },
          Single: {
            $when: {
              condition: { field: "single", operator: "contains", value: "a" },
              then: "Y: Yes",
            },
          },
        },
      },
    };
    await expectValid(mapping);
    expect(generateXml(mapping, { options: ["a"], single: "a" })).toEqual(
      `<?xml version='1.0' encoding='utf-8'?>\n<f:Root xmlns:f="urn:f">\n  <f:OptionA>Y: Yes</f:OptionA>\n  <f:OptionB>N: No</f:OptionB>\n</f:Root>`,
    );
    expect(generateXml(mapping, {})).toContain(
      "<f:NoneChosen>Y: Yes</f:NoneChosen>",
    );
  });

  it("compares answers as the API's runtime does", () => {
    const when = (
      field: string,
      operator: "equals" | "contains" | "in",
      value: unknown,
    ) =>
      ({
        $when: { condition: { field, operator, value }, then: "1" },
      }) as XmlMapping["root"][string][string];
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: {
          Equals: when("flag", "equals", 1),
          Contains: when("flags", "contains", 1),
          Count: when("count", "in", [1]),
        },
      },
    };
    const xml = generateXml(mapping, { flag: true, flags: [true], count: 1.0 });
    expect(xml).not.toContain("Equals");
    expect(xml).not.toContain("Contains");
    expect(xml).toContain("<f:Count>1</f:Count>");
  });

  it("refuses a $ key that isn't a function", () => {
    const mapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: { Root: { A: { $feild: "a" } } },
    } as unknown as XmlMapping;
    expect(() => generateXml(mapping, { a: "x" })).toThrow(
      /not a mapping function: \$feild/,
    );
  });

  it("refuses a transformation it doesn't implement", () => {
    const mapping: XmlMapping = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Root: { A: { $transform: { name: "shout", value: { $field: "a" } } } },
      },
    };
    expect(() => generateXml(mapping, { a: "x" })).toThrow(
      /unknown transform shout/,
    );
  });
});

describe("xml-mapping.json", () => {
  it("matches schema/xml-mapping.schema.json for every form", async () => {
    const validate = await schemaValidator();
    const forms = await readdir(path.join(outputDir, "forms"));
    expect(forms.length).toBeGreaterThan(0);
    for (const form of forms) {
      validate(await mappingOf(form));
      expect(validate.errors ?? [], form).toEqual([]);
    }
  });
});
