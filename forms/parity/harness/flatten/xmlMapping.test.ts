import { describe, expect, it } from "vitest";

import { xmlMappingFields } from "./xmlMapping.ts";
import { xmlTransformFields } from "./xmlTransform.ts";

describe("xmlMappingFields", () => {
  const mapping = {
    format: "xml-mapping",
    namespaces: { default: "urn:f", f: "urn:f", lib: "urn:lib" },
    root: {
      Form: {
        "@f:FormVersion": { $const: "1.0" },
        Title: { $field: "title" },
        Person: {
          $each: {
            items: { $field: "people" },
            map: {
              Profile: {
                PersonName: { "lib:FirstName": { $field: "name.first_name" } },
                Agrees: {
                  $transform: {
                    name: "boolean_to_yes_no",
                    value: { $field: "agrees" },
                  },
                },
                Sketch: { File: { $attachment: "sketch" } },
              },
            },
          },
        },
      },
    },
  };

  it("pairs each value's JSON path with its element path", () => {
    expect([...xmlMappingFields(mapping).byLink.keys()]).toEqual([
      "title -> Title",
      "people[].name.first_name -> Person/Profile/PersonName/FirstName",
      "people[].agrees -> Person/Profile/Agrees",
      "people[].sketch -> Person/Profile/Sketch/File",
    ]);
  });

  it("compares scalar attachment and value lists at their repeated leaves", () => {
    const lists = {
      root: {
        Form: {
          Attachments: {
            "att:AttachedFile": {
              $each: {
                items: { $field: "attachments" },
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
    expect([...xmlMappingFields(lists).byLink.keys()]).toEqual([
      "attachments[] -> Attachments/AttachedFile",
      "codes[] -> Code",
    ]);
  });

  it("keeps the parent list path when an inner list reads the current item", () => {
    const lists = {
      root: {
        Form: {
          Row: {
            $each: {
              items: { $field: "rows" },
              map: {
                Code: {
                  $each: { items: { $field: "." }, map: { $field: "." } },
                },
              },
            },
          },
        },
      },
    };
    expect([...xmlMappingFields(lists).byLink.keys()]).toEqual([
      "rows[][] -> Row/Code",
    ]);
  });

  it("flattens the same fields an XML transform with the same elements does", () => {
    const rules = {
      title: { xml_transform: { target: "Title" } },
      people: {
        xml_transform: { target: "Person", type: "array" },
        items: {
          name: {
            xml_transform: { target: "PersonName", type: "nested_object" },
            first_name: { xml_transform: { target: "FirstName" } },
          },
        },
      },
    };
    const flat = {
      format: "xml-mapping",
      namespaces: { default: "urn:f", f: "urn:f" },
      root: {
        Form: {
          Title: { $field: "title" },
          Person: {
            $each: {
              items: { $field: "people" },
              map: { PersonName: { FirstName: { $field: "name.first_name" } } },
            },
          },
        },
      },
    };
    expect([...xmlMappingFields(flat).byLink.keys()]).toEqual([
      ...xmlTransformFields(rules).byLink.keys(),
    ]);
  });
});
