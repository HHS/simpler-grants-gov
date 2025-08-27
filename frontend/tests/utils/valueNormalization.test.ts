import {
  stringifyOrEmpty,
  fromBooleanString,
  isBooleanString,
  toBooleanString,
  normalizeForCompare,
  parseFromInputValue,
} from "src/utils/valueNormalizationUtils";
import type { EnumOptionsType, StrictRJSFSchema } from "@rjsf/utils";

describe("valueNormalization utils", () => {
  describe("stringifyOrEmpty", () => {
    it("returns empty string for null/undefined", () => {
      expect(stringifyOrEmpty(null)).toBe("");
      expect(stringifyOrEmpty(undefined)).toBe("");
    });

    it("stringifies primitives and objects", () => {
      expect(stringifyOrEmpty(true)).toBe("true");
      expect(stringifyOrEmpty(false)).toBe("false");
      expect(stringifyOrEmpty(0)).toBe("0");
      expect(stringifyOrEmpty("abc")).toBe("abc");
      expect(stringifyOrEmpty({ a: 1 })).toBe("[object Object]");
    });
  });

  describe("fromBooleanString", () => {
    it("converts 'true'/'false' to booleans", () => {
      expect(fromBooleanString("true")).toBe(true);
      expect(fromBooleanString("false")).toBe(false);
    });

    it("returns undefined for non-boolean strings", () => {
      expect(fromBooleanString("TRUE")).toBeUndefined();
      expect(fromBooleanString("yes")).toBeUndefined();
      expect(fromBooleanString("0")).toBeUndefined();
      expect(fromBooleanString(true)).toBeUndefined();
    });
  });

  describe("isBooleanString", () => {
    it("identifies only the literal strings 'true' and 'false'", () => {
      expect(isBooleanString("true")).toBe(true);
      expect(isBooleanString("false")).toBe(true);
      expect(isBooleanString(true)).toBe(false);
      expect(isBooleanString(false)).toBe(false);
      expect(isBooleanString("TRUE")).toBe(false);
      expect(isBooleanString("0")).toBe(false);
    });
  });

  describe("toBooleanString", () => {
    it("maps true/false and their string forms to 'true'/'false'", () => {
      expect(toBooleanString(true)).toBe("true");
      expect(toBooleanString(false)).toBe("false");
      expect(toBooleanString("true")).toBe("true");
      expect(toBooleanString("false")).toBe("false");
    });

    it("returns '' for anything else", () => {
      expect(toBooleanString(undefined)).toBe("");
      expect(toBooleanString(null)).toBe("");
      expect(toBooleanString("yes")).toBe("");
      expect(toBooleanString(0)).toBe("");
    });
  });

  describe("normalizeForCompare", () => {
    it("coerces current booleans to 'true'/'false' when option is a boolean string", () => {
      expect(normalizeForCompare("true", true)).toBe("true");
      expect(normalizeForCompare("false", false)).toBe("false");
    });

    it("passes through current when already a boolean string", () => {
      expect(normalizeForCompare("true", "true")).toBe("true");
      expect(normalizeForCompare("false", "false")).toBe("false");
    });

    it("returns undefined when option expects boolean string but current is empty/unknown", () => {
      expect(normalizeForCompare("true", undefined)).toBeUndefined();
      expect(normalizeForCompare("false", null)).toBeUndefined();
    });

    it("does not coerce when option is a non-boolean value", () => {
      expect(normalizeForCompare("A", "A")).toBe("A");
      expect(normalizeForCompare(1, 1)).toBe(1);
      expect(normalizeForCompare("A", "B")).toBe("B");
    });
  });

  describe("parseFromInputValue", () => {
    const stringOptions: ReadonlyArray<EnumOptionsType<StrictRJSFSchema>> = [
      { label: "A", value: "A" },
      { label: "B", value: "B" },
    ];

    const booleanStringOptions: ReadonlyArray<EnumOptionsType<StrictRJSFSchema>> =
      [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ];

    it("returns raw string when enum is non-boolean", () => {
      expect(parseFromInputValue<StrictRJSFSchema>("A", stringOptions)).toBe(
        "A",
      );
      expect(parseFromInputValue<StrictRJSFSchema>("B", stringOptions)).toBe(
        "B",
      );
    });

    it("returns boolean when enum uses 'true'/'false' strings", () => {
      expect(
        parseFromInputValue<StrictRJSFSchema>("true", booleanStringOptions),
      ).toBe(true);
      expect(
        parseFromInputValue<StrictRJSFSchema>("false", booleanStringOptions),
      ).toBe(false);
    });
  });
});
