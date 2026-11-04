import { beforeAll, describe, expect, it } from "vitest";

import { DIFFS } from "./diffs/index.ts";
import {
  checkForm,
  loadPlans,
  report,
  type Discrepancy,
  type FormCheck,
} from "./harness/index.ts";
import { loadXmlMapping } from "./harness/load.ts";

// The XML mapping checks in `forms.test.ts`, reading `xml-mapping.json` (the mapping shaped
// like the XML) in place of `xml-transform.json`. Both flatten to the same fields, so the
// records in `parity/diffs/` apply to either. Delete this file with the transform format.

function expectNone(found: readonly Discrepancy[], header: string) {
  expect(found.length, report(header, found)).toBe(0);
}

const PLANS = loadPlans();

/** Whether a form has an emitted XML mapping. */
const mapped = (slug: string) => {
  const specId = PLANS.get(slug)?.spec_id;
  return Boolean(specId && loadXmlMapping(specId));
};

describe.each(DIFFS.filter((diff) => mapped(diff.slug)))(
  "$slug (xml-mapping.json)",
  (diff) => {
    let form: FormCheck;
    beforeAll(async () => {
      form = await checkForm(diff, PLANS, { xml: "xml-mapping" });
    });

    describe("plan vs XML mapping", () => {
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

    describe("XML mapping vs JSON schema", () => {
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

    describe("XML mapping vs XSD", () => {
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
  },
);
