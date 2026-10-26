import { describe, expect, it } from "vitest";
import { comparePair } from "./compare.ts";
import { isDecimalMultiple } from "./decimal.ts";
import { readConstraints } from "./flatten/plan.ts";
import { xsdFields } from "./flatten/xsd.ts";
import { jsonSchemaFields } from "./flatten/jsonSchema.ts";
import type { Fields } from "./model.ts";

const fields = (step?: number): Fields =>
  new Map([
    [
      "amount",
      {
        required: "no",
        rules: step === undefined ? {} : { multipleOf: step },
      },
    ],
  ]);

describe("decimal precision across artifacts", () => {
  it("keeps all three monetary constraints", () => {
    expect(
      readConstraints("minimum 0, maximum 9999999999.99, multipleOf 0.01"),
    ).toEqual({ minimum: 0, maximum: 9999999999.99, multipleOf: 0.01 });
  });
  it.each(["0", "-0.01", "NaN", "Infinity"])(
    "rejects invalid step %s",
    (step) => {
      expect(readConstraints(`minimum 0, multipleOf ${step}`)).toBeUndefined();
    },
  );
  it.each([
    [0, 1],
    [2, 0.01],
    [4, 0.0001],
  ])("reads fractionDigits %s", (digits, step) => {
    const xml = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      <xs:simpleType name="Money"><xs:restriction base="xs:decimal">
        <xs:fractionDigits value="${digits}"/></xs:restriction></xs:simpleType>
      <xs:element name="Form"><xs:complexType><xs:sequence>
        <xs:element name="Amount" type="Money"/>
      </xs:sequence></xs:complexType></xs:element></xs:schema>`;
    expect(
      xsdFields("https://example.test/form.xsd", () => xml).get("Amount")?.rules
        .multipleOf,
    ).toBe(step);
  });
  it("reads numeric precision without claiming a numeric keyword constrains strings", () => {
    const fields = jsonSchemaFields({
      type: "object",
      properties: {
        numeric: { type: "number", multipleOf: 0.01 },
        text: { type: "string", multipleOf: 0.01 },
      },
    });
    expect(fields.get("numeric")?.rules.multipleOf).toBe(0.01);
    expect(fields.get("text")?.rules.multipleOf).toBeUndefined();
  });
  it.each([
    [0.3, 0.1, true],
    [0.1, 0.01, true],
    [0.01, 0.1, false],
    [0.03, 0.02, false],
    [1e-6, 1e-7, true],
    [1e21, 1e20, true],
  ])("contains step %s within %s: %s", (plan, source, matches) => {
    expect(isDecimalMultiple(plan, source)).toBe(matches);
    const result = comparePair(
      { registers: {}, plan: fields(plan), source: fields(source) },
      {
        subject: "plan",
        constraints: { keywords: ["multipleOf"], mode: "contains" },
      },
    );
    expect(result.fieldConstraints.length).toBe(matches ? 0 : 1);
  });
  it("reports missing precision and rejects a stale recorded value", () => {
    const result = comparePair(
      {
        plan: fields(),
        source: fields(0.01),
        registers: {
          differingRules: {
            "amount/multipleOf": {
              plan: null,
              source: 0.1,
              category: "gap",
              reason: "old value",
            },
          },
        },
      },
      {
        subject: "plan",
        constraints: { keywords: ["multipleOf"], mode: "equal" },
      },
    );
    expect(result.fieldConstraints).toHaveLength(1);
    expect(result.recorded).toEqual([]);
  });
});
