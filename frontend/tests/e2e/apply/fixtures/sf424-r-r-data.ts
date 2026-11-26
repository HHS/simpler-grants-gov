import path from "path";
import {
  SF424_R_R_RADIO_ANSWERS,
  type fieldDefinitionsSF424RR,
} from "tests/e2e/apply/fixtures/sf424-r-r-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

// The SF-424 (R&R) generated from forms/specs. It has no hand-written form, so it has an
// opportunity of its own (E2E-SF424RRG).

const TEST_UPLOAD_FILE = path.resolve(
  __dirname,
  "../../test-upload-files/sample-upload-kb.pdf",
);

const address = (prefix: string, street: string): Record<string, string> => ({
  [`${prefix}--address--street1`]: street,
  [`${prefix}--address--street2`]: "Suite 100",
  [`${prefix}--address--city`]: "Boston",
  [`${prefix}--address--county`]: "Suffolk",
  [`${prefix}--address--state`]: "MA: Massachusetts",
  [`${prefix}--address--country`]: "USA: UNITED STATES",
  [`${prefix}--address--zip_code`]: "02108-1234",
});

const contact = (
  prefix: string,
  initials: string,
  suffix: string,
  withOrganization: boolean,
): Record<string, string> => ({
  [`${prefix}--name--prefix`]: "Dr.",
  [`${prefix}--name--first_name`]: `${initials} FIRST ${suffix}`,
  [`${prefix}--name--middle_name`]: "M",
  [`${prefix}--name--last_name`]: `${initials} LAST ${suffix}`,
  [`${prefix}--name--suffix`]: "Jr.",
  [`${prefix}--title`]: `${initials} TITLE`,
  ...(withOrganization
    ? {
        [`${prefix}--organization--name`]: `${initials} ORGANIZATION`,
        [`${prefix}--organization--department`]: `${initials} DEPARTMENT`,
        [`${prefix}--organization--division`]: `${initials} DIVISION`,
      }
    : {}),
  ...address(prefix, `${initials} STREET`),
  [`${prefix}--phone`]: "6175550100",
  [`${prefix}--fax`]: "6175550199",
  [`${prefix}--email`]: "simpler-grants-e2e-tester@navapbc.com",
});

/**
 * Happy-path test data for the SF-424 (R&R), with every attachment. `suffix` makes the
 * people's names unique to the run.
 */
export const buildSF424RRHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);
  return {
    "application--submission_type": SF424_R_R_RADIO_ANSWERS.submissionType,
    "application--date_submitted": "2026-11-05",
    "application--applicant_id": `APP-${shortSuffix}`,
    "application--state--received_date": "2026-11-03",
    "application--state--application_id": `MA-${shortSuffix}`,
    "application--federal_identifier": `FED-${shortSuffix}`,
    "application--agency_routing_number": `ROUTE-${shortSuffix}`,
    "application--application_type": SF424_R_R_RADIO_ANSWERS.applicationType,
    "application--other_agencies--submitted": "No",
    "applicant--organization--name": `ORGANIZATION ${shortSuffix}`,
    "applicant--organization--department": "SPONSORED RESEARCH",
    "applicant--organization--division": "RESEARCH OPERATIONS",
    ...address("applicant--organization", "10 ORCHARD STREET"),
    "applicant--organization--ein": "12-3456789",
    ...contact("contacts--point_of_contact", "POC", shortSuffix, false),
    "applicant--type--code":
      "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
    "project--title": `PROJECT TITLE ${shortSuffix}`,
    "project--timeline--start_date": "2027-01-01",
    "project--timeline--end_date": "2027-12-31",
    "applicant--congressional_district": "MA-007",
    ...contact("contacts--project_director", "PD", shortSuffix, true),
    "budget--funding_sources--federal": "100000.00",
    "budget--funding_sources--non_federal": "2500.50",
    "budget--funding_sources--total": "102500.50",
    "budget--funding_sources--program_income": "0.00",
    "application--state_review--status":
      SF424_R_R_RADIO_ANSWERS.stateReviewStatus,
    "certification--agree": "Yes",
    ...contact("contacts--authorized_representative", "AOR", shortSuffix, true),
    "attachments--lobbying_disclosure": TEST_UPLOAD_FILE,
    "attachments--pre_application": TEST_UPLOAD_FILE,
    "attachments--cover_letter": TEST_UPLOAD_FILE,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsSF424RR, string>>;
};

/**
 * Opportunity data for the SF-424 (R&R), generated from forms/specs. Seeded as E2E-SF424RRG
 * by build_automatic_opportunities.py and seed_local_db.py. Imported by
 * load-opportunity-config.ts to build the opportunity registry.
 */
export const SF424_R_R_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "1000d30f-4679-4f47-851a-fb044fa63bd9",
  opportunityNumber: "E2E-SF424RRG-ORG-IND-01",
  formKey: "sf424RRGenerated",
  expectedPrepopulatedFields: {
    "opportunity--agency_name": "Simpler Grants.gov",
    "opportunity--assistance_listing--number": "10.960",
    "opportunity--assistance_listing--title":
      "Technical Agricultural Assistance",
  },
  buildTestData: buildSF424RRHappyPathTestData,
};
