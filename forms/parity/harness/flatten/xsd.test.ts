import { describe, expect, it } from "vitest";

import { xsdFields } from "./xsd.ts";

describe("xsdFields", () => {
  const FORM = "https://example.test/Form.xsd";
  const LIB = "https://example.test/Lib.xsd";
  const ATT = "https://example.test/Att.xsd";
  const files: Record<string, string> = {
    [FORM]: `<?xml version="1.0"?>
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:lib="urn:lib" xmlns:f="urn:form" xmlns:att="http://apply.grants.gov/system/Attachments-V1.0" targetNamespace="urn:form">
        <xs:import namespace="urn:lib" schemaLocation="Lib.xsd"/>
        <xs:import namespace="http://apply.grants.gov/system/Attachments-V1.0" schemaLocation="Att.xsd"/>
        <xs:element name="Form">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Name" type="lib:Name"/>
              <xs:element name="Contact" maxOccurs="4" minOccurs="0" type="lib:Contact"/>
              <xs:element name="Sketch" type="att:AttachedFileDataType"/>
            </xs:sequence>
            <xs:attribute name="FormVersion" type="xs:string" fixed="1.0"/>
          </xs:complexType>
        </xs:element>
      </xs:schema>`,
    [LIB]: `<?xml version="1.0"?>
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:lib="urn:lib" targetNamespace="urn:lib">
        <xs:simpleType name="Name"><xs:restriction base="xs:string"><xs:minLength value="1"/><xs:maxLength value="60"/></xs:restriction></xs:simpleType>
        <xs:simpleType name="State"><xs:restriction base="xs:string"><xs:enumeration value="AL"/><xs:enumeration value="AK"/></xs:restriction></xs:simpleType>
        <xs:complexType name="Contact">
          <xs:sequence>
            <xs:element name="Phone" type="lib:Name"/>
            <xs:choice>
              <xs:element name="State" type="lib:State"/>
              <xs:element name="Province" type="lib:Name"/>
            </xs:choice>
          </xs:sequence>
        </xs:complexType>
      </xs:schema>`,
    [ATT]: `<?xml version="1.0"?>
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://apply.grants.gov/system/Attachments-V1.0">
        <xs:complexType name="AttachedFileDataType">
          <xs:sequence>
            <xs:element name="FileName" type="xs:string"/>
            <xs:element name="MimeType" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:schema>`,
  };
  const flat = xsdFields(FORM, (url) => files[url]);

  it("reads facets of imported named types", () => {
    expect(flat.get("Name")).toEqual({
      order: 0,
      required: "yes",
      rules: { minLength: 1, maxLength: 60, maxOccurs: 1, namespace: "" },
    });
  });

  it("reads an attached file as one answer", () => {
    expect(flat.get("Sketch")).toEqual({
      order: 4,
      required: "yes",
      rules: { maxOccurs: 1, namespace: "" },
    });
    expect([...flat.keys()].some((key) => key.startsWith("Sketch/"))).toBe(
      false,
    );
  });

  it("multiplies maxOccurs of repeating ancestors", () => {
    expect(flat.get("Contact/Phone")?.rules.maxOccurs).toBe(4);
  });

  it("reads unbounded repeating ancestor", () => {
    const unbounded = files[FORM].replace(
      'maxOccurs="4"',
      'maxOccurs="unbounded"',
    );
    const fields = xsdFields(FORM, (url) =>
      url === FORM ? unbounded : files[url],
    );
    expect(fields.get("Contact/Phone")?.rules.maxOccurs).toBe("unbounded");
  });

  it("requires nothing below optional element", () => {
    expect(flat.get("Contact/Phone")?.required).toBe("no");
  });

  it("requires no member of choice", () => {
    expect(flat.get("Contact/State")).toMatchObject({
      required: "no",
      rules: { enum: ["AL", "AK"], enumType: "State" },
    });
  });

  it("leaves out fixed attributes", () => {
    expect([...flat.keys()]).toEqual([
      "Name",
      "Contact/Phone",
      "Contact/State",
      "Contact/Province",
      "Sketch",
    ]);
  });

  it("places an element in its declaring schema's namespace only if qualified", () => {
    const qualified = (xsd: string) =>
      xsd.replace(
        /targetNamespace=/,
        'elementFormDefault="qualified" targetNamespace=',
      );
    const fields = xsdFields(FORM, (url) => qualified(files[url]));
    expect(flat.get("Contact/Phone")?.rules.namespace).toBe("");
    expect(fields.get("Name")?.rules.namespace).toBe("urn:form");
    expect(fields.get("Contact/Phone")?.rules.namespace).toBe("urn:lib");
  });

  it("rejects unsupported constructs", () => {
    const all = files[FORM].replace("<xs:sequence>", "<xs:all>").replace(
      "</xs:sequence>",
      "</xs:all>",
    );
    expect(() =>
      xsdFields(FORM, (url) => (url === FORM ? all : files[url])),
    ).toThrow(/xs:all/);
  });
});
