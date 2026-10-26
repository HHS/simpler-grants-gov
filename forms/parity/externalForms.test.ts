import { describe, expect, it } from "vitest";
import {
  xsdFields,
  type ExternalFormReference,
} from "./harness/flatten/xsd.ts";
import {
  externalForms,
  planFields,
  type Plan,
} from "./harness/flatten/plan.ts";
import { sourceCoordinates } from "./sourceBindings.ts";
const root = "https://example.test/upload.xsd",
  budget = "https://example.test/budget.xsd";
const files: Record<string, string> = {
  [root]: `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:upload" xmlns:b="urn:budget" elementFormDefault="qualified"><xs:import namespace="urn:budget" schemaLocation="budget.xsd"/><xs:element name="Upload"><xs:complexType><xs:sequence><xs:element name="ATT1" type="xs:string" minOccurs="0"/><xs:element name="ATT2" type="xs:string" minOccurs="0"/><xs:element name="BudgetAttachments" minOccurs="0"><xs:complexType><xs:sequence><xs:element ref="b:Budget" minOccurs="0" maxOccurs="2"/></xs:sequence></xs:complexType></xs:element></xs:sequence></xs:complexType></xs:element></xs:schema>`,
  [budget]: `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:budget" elementFormDefault="qualified"><xs:element name="Budget"><xs:complexType><xs:sequence><xs:element name="Amount" type="xs:decimal"/></xs:sequence></xs:complexType></xs:element></xs:schema>`,
};
const ref = (): ExternalFormReference => ({
  path: "BudgetAttachments/Budget",
  xsd_url: budget,
  namespace: "urn:budget",
  element: "Budget",
  min_occurs: 0,
  max_occurs: 2,
});
const read = (url: string) => {
  if (!files[url]) throw Error("Unpinned source");
  return files[url];
};
describe("explicit external global-element boundary", () => {
  it("keeps default full walk, and scopes only the declared reference without losing sibling inputs", () => {
    expect([...xsdFields(root, read).keys()]).toEqual([
      "ATT1",
      "ATT2",
      "BudgetAttachments/Budget/Amount",
    ]);
    const observations: any[] = [];
    const fields = xsdFields(root, read, undefined, {
      externalForms: [ref()],
      observations,
    });
    expect([...fields.keys()]).toEqual([
      "ATT1",
      "ATT2",
      "BudgetAttachments/Budget",
    ]);
    expect(fields.get(ref().path)).toMatchObject({
      required: "no",
      rules: { maxOccurs: 2, namespace: "urn:budget" },
    });
    expect(observations).toEqual([
      {
        ...ref(),
        required: false,
        maxOccurs: 2,
        payload_qualification: "not_compared",
      },
    ]);
    expect(xsdFields(root, read).has("BudgetAttachments/Budget/Amount")).toBe(
      true,
    );
  });
  it("refuses two source references collapsing to one declared path", () => {
    const source = files[root].replace(
      'ref="b:Budget" minOccurs="0" maxOccurs="2"/>',
      'ref="b:Budget" minOccurs="0" maxOccurs="2"/><xs:element ref="b:Budget" minOccurs="0" maxOccurs="2"/>',
    );
    expect(() =>
      xsdFields(root, (url) => (url === root ? source : read(url)), undefined, {
        externalForms: [ref()],
      }),
    ).toThrow(/ambiguous/);
  });
  for (const bad of [
    "uri",
    "namespace",
    "element",
    "path",
    "wrapper",
    "local-input",
    "minimum",
    "maximum",
    "duplicate",
    "overlap",
  ] as const)
    it(`fails closed for ${bad}`, () => {
      const value = ref();
      let refs = [value];
      if (bad === "uri") value.xsd_url = root;
      if (bad === "namespace") value.namespace = "urn:wrong";
      if (bad === "element") value.element = "Other";
      if (bad === "path") value.path = "Else/Budget";
      if (bad === "wrapper") value.path = "BudgetAttachments";
      if (bad === "local-input") value.path = "ATT1";
      if (bad === "minimum") value.min_occurs = 1;
      if (bad === "maximum") value.max_occurs = 3;
      if (bad === "duplicate") refs.push(ref());
      if (bad === "overlap")
        refs.push({ ...ref(), path: ref().path + "/Amount" });
      expect(() =>
        xsdFields(root, read, undefined, { externalForms: refs }),
      ).toThrow(/External form/);
    });
  it("refuses disguising an applicant answer as an external document", () => {
    const plan: Plan = {
      slug: "upload",
      children: [
        {
          kind: "field",
          label: "Budget",
          required: false,
          type: "External form",
          xml_path: ref().path,
          json_path: "hidden_answer",
          external_form: {
            xsd_url: budget,
            namespace: "urn:budget",
            element: "Budget",
          },
          post_populated: "Extracted from uploaded template",
        },
      ],
    };
    expect(() => externalForms(plan)).toThrow(/without applicant answer/);
  });
});
describe("finite scalar-array source slots", () => {
  const field = () => ({
    kind: "field" as const,
    label: "Budget files",
    required: false,
    json_path: "attachments[]",
    max_items: 2,
    dat_field: "UPLOAD",
    source_bindings: {
      at: "attachments",
      xml: [
        { kind: "slot" as const, path: "ATT1", index: 0 },
        { kind: "slot" as const, path: "ATT2", index: 1 },
      ],
    },
  });
  it("retains plain scalar-array identity and DAT shorthand while exposing exact ordered XML slots", () => {
    const f = field(),
      p: Plan = { slug: "upload", children: [f] };
    expect([...planFields(p, "json_path").keys()]).toEqual(["attachments[]"]);
    expect(
      [...planFields(p, "dat_field")].map(([path, value]) => [
        path,
        value.rules.maxOccurs,
      ]),
    ).toEqual([["UPLOAD", 2]]);
    expect(
      [...planFields(p, "xml_path")].map(([path, value]) => [
        path,
        value.rules.maxOccurs,
      ]),
    ).toEqual([
      ["ATT1", 1],
      ["ATT2", 1],
    ]);
  });
  for (const bad of [
    "missing",
    "duplicate-index",
    "duplicate-path",
    "out-of-range",
    "wrong-owner",
    "xml-shorthand",
  ])
    it(`refuses ${bad}`, () => {
      const f = field();
      if (bad === "missing") f.source_bindings.xml.pop();
      if (bad === "duplicate-index") f.source_bindings.xml[1].index = 0;
      if (bad === "duplicate-path") f.source_bindings.xml[1].path = "ATT1";
      if (bad === "out-of-range") f.source_bindings.xml[1].index = 2;
      if (bad === "wrong-owner") f.source_bindings.at = "other";
      if (bad === "xml-shorthand") Object.assign(f, { xml_path: "ATT1" });
      const problems: any[] = [];
      expect(sourceCoordinates(f, 2, "xsd", problems)).toEqual([]);
      expect(problems.length).toBeGreaterThan(0);
    });
});
