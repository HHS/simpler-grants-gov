/**
 * Whether each check in `forms.test.ts` reports what its name says, on hand-built fields.
 * Describe blocks use the same names as the checks they vouch for.
 */
import { describe, expect, it } from "vitest";

import { comparePair, type PairSpec } from "./harness/compare.ts";
import type { Fields, FlatField, Registers, Wording } from "./harness/model.ts";

type Spec = Partial<PairSpec>;

const fields = (entries: Record<string, Partial<FlatField>>): Fields =>
  new Map(
    Object.entries(entries).map(([path, f]) => [path, { rules: {}, ...f }]),
  );

/** Compares `plan` with `source`, the plan being the subject unless `spec` says otherwise. */
const compare = (
  plan: Record<string, Partial<FlatField>>,
  source: Record<string, Partial<FlatField>>,
  {
    registers = {},
    wording,
    ...spec
  }: Spec & { registers?: Registers; wording?: Wording } = {},
) =>
  comparePair(
    { registers, wording, plan: fields(plan), source: fields(source) },
    { subject: "plan", ...spec },
  );

/** Any reason a recorded difference is accepted; tests about recording need one. */
const WHY = { category: "gap", reason: "reason" } as const;

const paths = (found: { path: string }[]) => found.map((d) => d.path);
const kinds = (found: { kind: string }[]) => found.map((d) => d.kind);

describe("has no missing fields", () => {
  it("flags field only other side has", () => {
    expect(paths(compare({ a: {} }, { a: {}, b: {} }).missingFields)).toEqual([
      "b",
    ]);
  });

  it("flags plan field implementation lacks", () => {
    const result = compare({ a: {}, b: {} }, { a: {} }, { subject: "source" });
    expect(paths(result.missingFields)).toEqual(["b"]);
  });

  it("follows declared rename", () => {
    const result = compare(
      { a: {} },
      { b: {} },
      { registers: { renamed: { a: { to: "b", ...WHY } } } },
    );
    expect(result.missingFields).toEqual([]);
  });

  it("ignores recorded absence", () => {
    const result = compare(
      {},
      { b: {} },
      { registers: { absentFromPlan: { b: WHY } } },
    );
    expect(result.missingFields).toEqual([]);
  });
});

describe("has no extra fields", () => {
  it("flags field only subject has", () => {
    expect(paths(compare({ a: {}, b: {} }, { a: {} }).extraFields)).toEqual([
      "b",
    ]);
  });

  it("flags implementation field plan lacks", () => {
    const result = compare({ a: {} }, { a: {}, b: {} }, { subject: "source" });
    expect(paths(result.extraFields)).toEqual(["b"]);
  });

  it("ignores recorded addition", () => {
    const result = compare(
      { b: {} },
      {},
      { registers: { absentFromSource: { b: WHY } } },
    );
    expect(result.extraFields).toEqual([]);
  });
});

describe("matches field order", () => {
  it("flags only fields that break order", () => {
    const result = compare(
      { a: { order: 0 }, b: { order: 1 }, c: { order: 2 }, d: { order: 3 } },
      { a: { order: 0 }, c: { order: 1 }, d: { order: 2 }, b: { order: 3 } },
      { order: true },
    );
    expect(paths(result.fieldOrder)).toEqual(["b"]);
  });

  it("ignores fields absent from one side", () => {
    const result = compare(
      { a: { order: 0 }, x: { order: 1 }, b: { order: 2 } },
      { a: { order: 0 }, b: { order: 1 } },
      { order: true },
    );
    expect(result.fieldOrder).toEqual([]);
  });

  it("reports nothing when spec omits order", () => {
    const result = compare(
      { a: { order: 0 }, b: { order: 1 } },
      { a: { order: 1 }, b: { order: 0 } },
    );
    expect(result.fieldOrder).toEqual([]);
  });
});

describe("matches field labels", () => {
  it("flags differing label", () => {
    const result = compare(
      { a: { label: "Street1" } },
      { a: { label: "Street 1" } },
      { labels: true },
    );
    expect(paths(result.fieldLabels)).toEqual(["a"]);
  });

  it("ignores whitespace differences", () => {
    const result = compare(
      { a: { label: "First  Name " } },
      { a: { label: "First Name" } },
      { labels: true },
    );
    expect(result.fieldLabels).toEqual([]);
  });

  it("ignores case differences", () => {
    const result = compare(
      { a: { label: "Zip / Postal Code" } },
      { a: { label: "Zip / postal code" } },
      { labels: true },
    );
    expect(result.fieldLabels).toEqual([]);
  });
});

describe("matches help text", () => {
  it("flags help present on one side only", () => {
    const result = compare(
      { a: {} },
      { a: { help: "Enter it." } },
      { help: true },
    );
    expect(paths(result.helpText)).toEqual(["a"]);
  });

  it("ignores case differences", () => {
    const result = compare(
      { a: { help: "Enter the middle name." } },
      { a: { help: "Enter the Middle Name." } },
      { help: true },
    );
    expect(result.helpText).toEqual([]);
  });

  const recorded = {
    differingHelp: {
      a: {
        plan: "Enter the name.",
        source: "Please enter the Payee's name.",
        ...WHY,
      },
    },
  };

  it("ignores recorded difference", () => {
    const result = compare(
      { a: { help: "Enter the name." } },
      { a: { help: "Please  enter the Payee's name." } },
      { help: true, registers: recorded },
    );
    expect(result.helpText).toEqual([]);
  });

  it("flags recorded difference whose text changed", () => {
    const result = compare(
      { a: { help: "Enter the name." } },
      { a: { help: "Please enter the Payee's full name." } },
      { help: true, registers: recorded },
    );
    expect(paths(result.helpText)).toEqual(["a"]);
  });
});

describe("accepts the form's own wording", () => {
  const wording = { labels: WHY, help: WHY };

  it("lists every differing label and help text as recorded, with both values", () => {
    const result = compare(
      { a: { label: "Title", help: "Enter the title." } },
      { a: { label: "Position/Title", help: "The title of the PD/PI." } },
      { labels: true, help: true, wording },
    );
    expect(result.fieldLabels).toEqual([]);
    expect(result.helpText).toEqual([]);
    expect(result.recorded.map((d) => d.values)).toEqual([
      { plan: "Title", source: "Position/Title" },
      { plan: "Enter the title.", source: "The title of the PD/PI." },
    ]);
  });

  it("flags itself once nothing differs", () => {
    const result = compare(
      { a: { label: "Title", help: "Enter it." } },
      { a: { label: "Title", help: "Enter it." } },
      { labels: true, help: true, wording },
    );
    expect(paths(result.stale)).toEqual(["wording.labels", "wording.help"]);
  });
});

describe("matches field constraints", () => {
  const equal = (
    ...keywords: NonNullable<PairSpec["constraints"]>["keywords"]
  ) => ({
    constraints: { keywords, mode: "equal" as const },
  });

  it("flags constraint stated on one side only", () => {
    const result = compare(
      { a: {} },
      { a: { rules: { minLength: 1 } } },
      equal("minLength"),
    );
    expect(kinds(result.fieldConstraints)).toEqual(["minLength differs"]);
  });

  it("flags differing requiredness", () => {
    const result = compare(
      { a: { required: "yes" } },
      { a: { required: "no" } },
      equal(),
    );
    expect(kinds(result.fieldConstraints)).toEqual(["requiredness differs"]);
  });

  it("accepts enum values in any order", () => {
    const result = compare(
      { a: { rules: { enum: ["x", "y"] } } },
      { a: { rules: { enum: ["y", "x"] } } },
      equal("enum"),
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  it("accepts conditional plan against optional source", () => {
    const result = compare(
      { a: { required: "conditional" } },
      { a: { required: "no" } },
      equal(),
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  it("ignores keywords spec does not compare", () => {
    const result = compare(
      { a: { rules: { minLength: 1 } } },
      { a: {} },
      equal("maxLength"),
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  it("ignores recorded difference with same values", () => {
    const result = compare(
      { a: { rules: { maxLength: 4 } } },
      { a: { rules: { maxLength: 6 } } },
      {
        ...equal("maxLength"),
        registers: {
          differingRules: {
            "a/maxLength": { plan: 4, source: 6, ...WHY },
          },
        },
      },
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  it("flags recorded difference whose values changed", () => {
    const result = compare(
      { a: { rules: { maxLength: 5 } } },
      { a: { rules: { maxLength: 6 } } },
      {
        ...equal("maxLength"),
        registers: {
          differingRules: {
            "a/maxLength": { plan: 4, source: 6, ...WHY },
          },
        },
      },
    );
    expect(result.fieldConstraints.map((d) => d.detail)).toEqual([
      "plan 5, source 6; recorded as plan 4, source 6",
    ]);
  });

  it("pins a value the plan leaves out as null", () => {
    const result = compare(
      { a: {} },
      { a: { rules: { minLength: 1 } } },
      {
        ...equal("minLength"),
        registers: {
          differingRules: {
            "a/minLength": { plan: null, source: 1, ...WHY },
          },
        },
      },
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  describe("where subject may be stricter", () => {
    const contains = {
      constraints: { keywords: ["maxLength", "enum"], mode: "contains" },
    } satisfies Spec;

    it("accepts stricter subject", () => {
      const result = compare(
        { a: { required: "yes", rules: { maxLength: 10, enum: ["x"] } } },
        { a: { required: "no", rules: { maxLength: 20, enum: ["x", "y"] } } },
        contains,
      );
      expect(result.fieldConstraints).toEqual([]);
    });

    it("flags looser subject", () => {
      const result = compare(
        { a: { required: "no", rules: { maxLength: 30, enum: ["x", "z"] } } },
        { a: { required: "yes", rules: { maxLength: 20, enum: ["x", "y"] } } },
        contains,
      );
      expect(kinds(result.fieldConstraints)).toEqual([
        "requiredness differs",
        "maxLength differs",
        "enum differs",
      ]);
    });

    it("flags bound subject leaves out", () => {
      const result = compare(
        { a: {} },
        { a: { rules: { maxLength: 20 } } },
        contains,
      );
      expect(kinds(result.fieldConstraints)).toEqual(["maxLength differs"]);
    });
  });
});

describe("matches field occurrences", () => {
  it("flags differing bound", () => {
    const result = compare(
      { a: { rules: { maxOccurs: 4 } } },
      { a: { rules: { maxOccurs: 5 } } },
      { occurrences: "equal" },
    );
    expect(paths(result.fieldOccurrences)).toEqual(["a"]);
  });

  it("reports occurrences apart from constraints", () => {
    const result = compare(
      { a: { rules: { maxOccurs: 4 } } },
      { a: { rules: { maxOccurs: 5 } } },
      {
        occurrences: "equal",
        constraints: { keywords: ["maxLength"], mode: "equal" },
      },
    );
    expect(result.fieldConstraints).toEqual([]);
  });

  it("ignores requiredness", () => {
    const result = compare(
      { a: { required: "yes", rules: { maxOccurs: 1 } } },
      { a: { required: "no", rules: { maxOccurs: 1 } } },
      { occurrences: "equal" },
    );
    expect(result.fieldOccurrences).toEqual([]);
  });

  describe("where subject may be stricter", () => {
    it("accepts fewer repeats than source", () => {
      const result = compare(
        { a: { rules: { maxOccurs: 4 } } },
        { a: { rules: { maxOccurs: "unbounded" } } },
        { occurrences: "contains" },
      );
      expect(result.fieldOccurrences).toEqual([]);
    });

    it("flags unbounded subject against bounded source", () => {
      const result = compare(
        { a: { rules: { maxOccurs: "unbounded" } } },
        { a: { rules: { maxOccurs: 4 } } },
        { occurrences: "contains" },
      );
      expect(paths(result.fieldOccurrences)).toEqual(["a"]);
    });
  });
});

describe("recorded differences still exist", () => {
  it("flags entry matching no difference", () => {
    const result = compare(
      { a: { label: "Name" } },
      { a: { label: "Name" } },
      {
        labels: true,
        registers: {
          differingLabels: {
            a: { plan: "Name", source: "Full Name", ...WHY },
          },
        },
      },
    );
    expect(paths(result.stale)).toEqual(["a"]);
  });

  it("flags rename to missing path", () => {
    const result = compare(
      { a: {} },
      { a: {} },
      { registers: { renamed: { a: { to: "b", ...WHY } } } },
    );
    expect(paths(result.stale)).toEqual(["a"]);
  });

  it("flags rename to same path", () => {
    const result = compare(
      { a: {} },
      { a: {} },
      { registers: { renamed: { a: { to: "a", ...WHY } } } },
    );
    expect(paths(result.stale)).toEqual(["a"]);
  });
});

describe("lists recorded differences", () => {
  const registers: Registers = {
    differingLabels: { a: { plan: "Name", source: "Full Name", ...WHY } },
  };

  it("lists difference with entry accepting it", () => {
    const result = compare(
      { a: { label: "Name" } },
      { a: { label: "Full Name" } },
      { labels: true, registers },
    );
    expect(paths(result.recorded)).toEqual(["a"]);
    expect(result.recorded[0].entry.category).toBe("gap");
  });

  it("omits difference that changed since recorded", () => {
    const result = compare(
      { a: { label: "Name" } },
      { a: { label: "Given Name" } },
      { labels: true, registers },
    );
    expect(result.recorded).toEqual([]);
    expect(paths(result.fieldLabels)).toEqual(["a"]);
  });
});
