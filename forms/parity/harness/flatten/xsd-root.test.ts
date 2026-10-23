import { describe, expect, it } from "vitest";
import { xsdFields } from "./xsd.ts";
const url = "https://example.test/legacy.xsd";
const schema = `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:f="urn:legacy" targetNamespace="urn:legacy" elementFormDefault="qualified">
<xsd:element name="Form" type="f:Body"/><xsd:element name="Amount" type="f:Money"/>
<xsd:simpleType name="Money"><xsd:restriction base="xsd:decimal"><xsd:fractionDigits value="2"/></xsd:restriction></xsd:simpleType>
<xsd:complexType name="Body"><xsd:sequence><xsd:group ref="f:Amounts" minOccurs="0" maxOccurs="4"/></xsd:sequence><xsd:attribute ref="f:kind" use="required"/><xsd:attribute ref="f:version" use="required"/></xsd:complexType>
<xsd:group name="Amounts"><xsd:sequence><xsd:element ref="f:Amount"/></xsd:sequence></xsd:group>
<xsd:attribute name="kind" type="xsd:string" fixed="Budget"/><xsd:attribute name="version" type="xsd:string"/>
</xsd:schema>`;
describe("explicit legacy XSD root", () => {
  it("reads selected named root, global groups and referenced fixed/required attributes", () => {
    const fields = xsdFields(url, () => schema, "Form");
    expect([...fields.keys()]).toEqual(["Amount", "/@version"]);
    expect(fields.get("Amount")).toMatchObject({
      required: "no",
      rules: { multipleOf: 0.01, maxOccurs: 4, namespace: "urn:legacy" },
    });
    expect(fields.get("/@version")?.required).toBe("yes");
  });
  it("refuses to guess among multiple globals", () => {
    expect(() => xsdFields(url, () => schema)).toThrow("selected root");
  });
  it("refuses an unknown selected root", () => {
    expect(() => xsdFields(url, () => schema, "Other")).toThrow(
      "selected root",
    );
  });
  it("refuses recursive model groups", () => {
    expect(() =>
      xsdFields(
        url,
        () =>
          schema.replace(
            '<xsd:element ref="f:Amount"/>',
            '<xsd:group ref="f:Amounts"/>',
          ),
        "Form",
      ),
    ).toThrow("recursive group");
  });
  it("refuses unresolved groups", () => {
    expect(() =>
      xsdFields(
        url,
        () => schema.replace('ref="f:Amounts"', 'ref="f:Unknown"'),
        "Form",
      ),
    ).toThrow("unknown group");
  });
});
