import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

export const RR_OTHER_PROJECT_INFO_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "a1da3b62-046e-5a6c-9125-eb9bfff1d65f",
    opportunityNumber: "E2E-RROPI-ORG-IND-01",
    formKey: "rrOtherInfoGenerated",
    expectedPrepopulatedFields: {},
    buildTestData: () => ({
      human_subjects_involved: "No",
      vertebrate_animals_used: "No",
      proprietary_information_included: "No",
      environmental_impact: "No",
      historic_site_designated_or_eligible: "No",
      international_activities_involved: "No",
    }),
  };
