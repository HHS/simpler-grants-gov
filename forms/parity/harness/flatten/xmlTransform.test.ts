import { describe, expect, it } from "vitest";

import { xmlTransformFields } from "./xmlTransform.ts";

describe("xmlTransformFields", () => {
  const rules = {
    _xml_config: { xml_structure: { root_element: "Form" } },
    title: { xml_transform: { target: "Title" } },
    people: {
      xml_transform: { target: "Person", type: "array" },
      items: {
        name: {
          xml_transform: { target: "PersonName", type: "nested_object" },
          first_name: {
            xml_transform: { target: "FirstName", namespace: "globLib" },
          },
        },
        contact: {
          phone: { xml_transform: { target: "Phone" } },
        },
      },
    },
  };

  it("pairs each leaf's JSON path with its element path", () => {
    expect([...xmlTransformFields(rules).byLink.keys()]).toEqual([
      "title -> Title",
      "people[].name.first_name -> Person/PersonName/FirstName",
      "people[].contact.phone -> Person/Phone",
    ]);
  });

  it("keys the same fields by each side alone, in rule order", () => {
    const { byJsonPath, byXmlPath } = xmlTransformFields(rules);
    expect([...byJsonPath.keys()]).toEqual([
      "title",
      "people[].name.first_name",
      "people[].contact.phone",
    ]);
    expect([...byXmlPath].map(([path, field]) => [path, field.order])).toEqual([
      ["Title", 0],
      ["Person/PersonName/FirstName", 1],
      ["Person/Phone", 2],
    ]);
  });

  it("maps each root attachment field after the rules", () => {
    const { byLink } = xmlTransformFields({
      _xml_config: {
        attachment_fields: {
          upload: { xml_element: "AttachedFile", file_element: "" },
          sketch: { xml_element: "Sketches", file_element: "Sketch" },
        },
      },
      title: { xml_transform: { target: "Title" } },
    });
    expect([...byLink].map(([path, field]) => [path, field.order])).toEqual([
      ["title -> Title", 0],
      ["upload -> AttachedFile", 1],
      ["sketch -> Sketches/Sketch", 2],
    ]);
  });

  it("refuses a rule type it cannot read", () => {
    expect(() =>
      xmlTransformFields({
        budget: {
          xml_transform: { target: "Budget", type: "conditional" },
        },
      }),
    ).toThrow(/unsupported xml_transform type conditional at budget/);
  });
});
