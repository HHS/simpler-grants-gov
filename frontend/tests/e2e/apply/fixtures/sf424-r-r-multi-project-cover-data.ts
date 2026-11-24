import { buildSF424RRHappyPathTestData } from "tests/e2e/apply/fixtures/sf424-r-r-data";
import type { fieldDefinitionsSF424RRMultiProjectCover } from "tests/e2e/apply/fixtures/sf424-r-r-multi-project-cover-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

// The SF-424 R&R Multi-Project Cover generated from forms/specs. It has no hand-written
// form, so it has an opportunity of its own (E2E-RRMPCG).

/**
 * Happy-path test data for the SF-424 R&R Multi-Project Cover, with every attachment. The
 * form asks the SF-424 (R&R)'s questions, so answer them the same way. `suffix` makes the
 * people's names unique to the run.
 */
export const buildSF424RRMultiProjectCoverHappyPathTestData = (
  suffix: number,
): Record<string, string> =>
  buildSF424RRHappyPathTestData(suffix) satisfies Partial<
    Record<keyof typeof fieldDefinitionsSF424RRMultiProjectCover, string>
  >;

/**
 * Opportunity data for the SF-424 R&R Multi-Project Cover, generated from forms/specs.
 * Seeded as E2E-RRMPCG by build_automatic_opportunities.py and seed_local_db.py. Imported
 * by load-opportunity-config.ts to build the opportunity registry.
 */
export const SF424_R_R_MULTI_PROJECT_COVER_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "bcc362c8-9188-4362-b263-8b296a2a2b76",
    opportunityNumber: "E2E-RRMPCG-ORG-IND-01",
    formKey: "sf424RRMultiProjectCoverGenerated",
    expectedPrepopulatedFields: {
      "opportunity--agency_name": "Simpler Grants.gov",
      "opportunity--assistance_listing--number": "10.960",
      "opportunity--assistance_listing--title":
        "Technical Agricultural Assistance",
    },
    buildTestData: buildSF424RRMultiProjectCoverHappyPathTestData,
  };
