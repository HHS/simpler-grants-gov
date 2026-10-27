import { beforeAll, describe, expect, it } from "vitest";

import { DIFFS } from "./diffs/index.ts";
import {
  checkForm,
  hasXmlTransform,
  loadGrantsGovIdentity,
  loadPlans,
  report,
  type Discrepancy,
  type FormCheck,
} from "./harness/index.ts";

function expectNone(found: readonly Discrepancy[], header: string) {
  expect(found.length, report(header, found)).toBe(0);
}

const PLANS = loadPlans();

/** A plan's `MM/DD/YYYY` date as the ISO `YYYY-MM-DD` that `@GrantsGov.form` takes. */
const isoDate = (date: string) =>
  date.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$1-$2");

/** Whether a form has a compiled spec. A record without one gets requirements checks only. */
const compiled = (slug: string) => Boolean(PLANS.get(slug)?.spec_id);

/** Whether a form has emitted XML transform rules: whether it is mapped to the XSD yet. */
const mapped = (slug: string) => {
  const specId = PLANS.get(slug)?.spec_id;
  return Boolean(specId && hasXmlTransform(specId));
};

describe("registry", () => {
  it("lists every plan with spec_id", () => {
    const listed = new Set(DIFFS.map((diff) => diff.slug));
    const unlisted = [...PLANS.values()]
      .filter((plan) => plan.spec_id && !listed.has(plan.slug))
      .map((plan) => plan.slug);
    expect(unlisted, "add a record to parity/diffs/ for each").toEqual([]);
  });
});

describe.each(DIFFS)("$slug", (diff) => {
  let form: FormCheck;
  beforeAll(async () => {
    form = await checkForm(diff);
  });

  // Does the plan say what Grants.gov says?
  describe("Requirements checks", () => {
    describe("plan vs DAT", () => {
      const dat = () => form.requirements.dat;

      it("plan has no missing fields", () => {
        expectNone(dat().missingFields, "DAT fields the plan lacks:");
      });

      it("plan has no extra fields", () => {
        expectNone(dat().extraFields, "Plan fields the DAT lacks:");
      });

      it("plan matches field order", () => {
        expectNone(dat().fieldOrder, "Plan fields out of DAT order:");
      });

      it("plan matches field labels", () => {
        expectNone(dat().fieldLabels, "Labels that differ from the DAT:");
      });

      it("plan matches field occurrences", () => {
        expectNone(
          dat().fieldOccurrences,
          "Occurrences that differ from the DAT:",
        );
      });

      it("plan matches field constraints", () => {
        expectNone(
          dat().fieldConstraints,
          "Constraints that differ from the DAT:",
        );
      });

      it("plan matches help text", () => {
        expectNone(dat().helpText, "Help text that differs from the DAT:");
      });
    });

    describe("plan vs XSD", () => {
      const xsd = () => form.requirements.xsd;

      it("plan has no missing fields", () => {
        expectNone(xsd().missingFields, "XSD elements the plan lacks:");
      });

      it("plan has no extra fields", () => {
        expectNone(xsd().extraFields, "Plan fields the XSD lacks:");
      });

      it("plan matches field occurrences", () => {
        expectNone(
          xsd().fieldOccurrences,
          "Occurrences that differ from the XSD:",
        );
      });

      it("plan matches field constraints", () => {
        expectNone(
          xsd().fieldConstraints,
          "Constraints that differ from the XSD:",
        );
      });
    });
  });

  // Does what we built do what the plan says?
  describe.skipIf(!compiled(diff.slug))("Implementation checks", () => {
    describe("plan vs Grants.gov identity", () => {
      const plan = () => PLANS.get(diff.slug)!;
      const identity = () =>
        loadGrantsGovIdentity(plan().spec_id!) as {
          ombNumber?: string;
          expirationDate?: string;
        } | null;

      it("identity matches the OMB number", () => {
        expect(identity()?.ombNumber ?? "").toBe(plan().omb_number ?? "");
      });

      it("identity matches the OMB expiration date", () => {
        expect(identity()?.expirationDate ?? "").toBe(
          isoDate(plan().expiration_date ?? ""),
        );
      });
    });

    describe("plan vs JSON schema", () => {
      const schema = () => form.implementation!.jsonSchema;

      it("JSON schema has no missing fields", () => {
        expectNone(
          schema().missingFields,
          "Plan fields the JSON schema lacks:",
        );
      });

      it("JSON schema has no extra fields", () => {
        expectNone(schema().extraFields, "JSON schema fields the plan lacks:");
      });

      it("JSON schema matches field occurrences", () => {
        expectNone(
          schema().fieldOccurrences,
          "Occurrences that differ from the plan:",
        );
      });

      it("JSON schema matches field constraints", () => {
        expectNone(
          schema().fieldConstraints,
          "Constraints that differ from the plan:",
        );
      });
    });

    describe("plan vs UI schema", () => {
      const ui = () => form.implementation!.uiSchema;

      it("UI schema has no missing fields", () => {
        expectNone(ui().missingFields, "Plan fields the UI schema lacks:");
      });

      it("UI schema has no extra fields", () => {
        expectNone(ui().extraFields, "UI schema fields the plan lacks:");
      });

      it("UI schema matches field order", () => {
        expectNone(ui().fieldOrder, "UI schema fields out of plan order:");
      });

      it("UI schema matches field labels", () => {
        expectNone(ui().fieldLabels, "Labels that differ from the plan:");
      });

      it("UI schema matches help text", () => {
        expectNone(ui().helpText, "Help text that differs from the plan:");
      });
    });

    // Not emitted yet: the rules schema will come from the SGG decorators.
    describe("plan vs rules schema", () => {
      it.todo("rules schema has no missing rules");
      it.todo("rules schema has no extra rules");
    });

    // Fields are compared as `<json_path> -> <xml_path>`, so a field mapped to a different
    // element than the plan says is both missing and extra.
    describe.skipIf(!mapped(diff.slug))("plan vs XML mapping", () => {
      const mapping = () => form.implementation!.xmlMapping!;

      it("XML mapping has no missing fields", () => {
        expectNone(
          mapping().missingFields,
          "Plan links the XML mapping lacks:",
        );
      });

      it("XML mapping has no extra fields", () => {
        expectNone(mapping().extraFields, "XML mapping links the plan lacks:");
      });
    });
  });

  // Will the XML we send pass Grants.gov's validation?
  describe.skipIf(!compiled(diff.slug))("XML checks", () => {
    describe.skipIf(!mapped(diff.slug))("XML mapping vs JSON schema", () => {
      const mapping = () => form.xml!.xmlMappingVsJsonSchema!;

      it("XML mapping has no missing fields", () => {
        expectNone(
          mapping().missingFields,
          "JSON schema fields the XML mapping lacks:",
        );
      });

      it("XML mapping has no extra fields", () => {
        expectNone(
          mapping().extraFields,
          "XML mapping fields the JSON schema lacks:",
        );
      });
    });

    describe.skipIf(!mapped(diff.slug))("XML mapping vs XSD", () => {
      const mapping = () => form.xml!.xmlMappingVsXsd!;

      it("XML mapping has no missing fields", () => {
        expectNone(
          mapping().missingFields,
          "XSD elements the XML mapping lacks:",
        );
      });

      it("XML mapping has no extra fields", () => {
        expectNone(
          mapping().extraFields,
          "XML mapping elements the XSD lacks:",
        );
      });

      it("XML mapping matches field order", () => {
        expectNone(
          mapping().fieldOrder,
          "XML mapping elements out of XSD order:",
        );
      });
    });

    describe("JSON schema vs XSD", () => {
      it("JSON schema matches field occurrences", () => {
        expectNone(
          form.xml!.jsonSchemaVsXsd.fieldOccurrences,
          "JSON schema allows more repeats than the XSD:",
        );
      });

      it("JSON schema matches field constraints", () => {
        expectNone(
          form.xml!.jsonSchemaVsXsd.fieldConstraints,
          "JSON schema rules looser than the XSD:",
        );
      });
    });
  });

  // Can the checks above be trusted for this form?
  describe("Suite checks", () => {
    it("plan has readable requiredness and constraints", () => {
      expectNone(form.suite.planProblems, "Plan text the suite cannot read:");
    });

    it.skipIf(!compiled(diff.slug))(
      "JSON schema matches index.json fields",
      () => {
        expectNone(
          form.suite.indexProblems,
          "JSON schema and index.json disagree:",
        );
      },
    );

    it("recorded differences still exist", () => {
      expectNone(
        form.suite.stale,
        "Entries in parity/diffs/ that no longer match a difference:",
      );
    });
  });
});
