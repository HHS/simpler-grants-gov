import path from "path";
import type { fieldDefinitionsSF424Mandatory } from "tests/e2e/apply/fixtures/sf424-mandatory-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

// The SF424 Mandatory Form generated from forms/specs. It has no hand-written form, so it
// has an opportunity of its own (E2E-SF424MANDATORYG).

const TEST_UPLOAD_FILE = path.resolve(
  __dirname,
  "../../test-upload-files/sample-upload-kb.pdf",
);

/** A person's answers, by path below the person. */
const personAnswers = (
  person: string,
  initials: string,
  suffix: string,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries({
      "name--prefix": "Dr.",
      "name--first_name": `${initials}First${suffix}`,
      "name--middle_name": `${initials}Mid`,
      "name--last_name": `${initials}Last${suffix}`,
      "name--suffix": "Jr.",
      title: `${initials}Title${suffix}`,
      "organization--name": `${initials}Org${suffix}`,
      phone: "4105550100",
      fax: "4105550199",
      email: `${initials.toLowerCase()}${suffix}@example.com`,
    }).map(([field, value]) => [`${person}--${field}`, value]),
  );

/**
 * Happy-path test data builder for the SF424 Mandatory Form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * Leaves out each follow-up, since its question takes the answer that doesn't ask for it.
 */
export const buildSF424MandatoryHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    "application--submission_type": "Application",
    "application--frequency--code": "Annual",
    "application--consolidated_request--answer": "No",
    "application--version": "Initial",
    "application--state--received_date": "2026-10-29",
    "application--applicant_id": `APPID${shortSuffix}`,
    "application--federal_entity_identifier": `FEI${shortSuffix}`,
    "application--federal_award_identifier": `FAI${shortSuffix}`,
    "application--state--application_id": `SAI${shortSuffix}`,
    "applicant--organization--name": `Org ${shortSuffix}`,
    "applicant--organization--ein": "44-4444444",
    "applicant--organization--address--street1": `${shortSuffix} Main St`,
    "applicant--organization--address--street2": `Suite ${shortSuffix}`,
    "applicant--organization--address--city": `City ${shortSuffix}`,
    "applicant--organization--address--county": `County ${shortSuffix}`,
    "applicant--organization--address--state": "MD: Maryland",
    "applicant--organization--address--country": "USA: UNITED STATES",
    "applicant--organization--address--zip_code": "21218-1234",
    "applicant--organization--department": `Dept ${shortSuffix}`,
    "applicant--organization--division": `Div ${shortSuffix}`,
    "applicant--type--code": "A: State Government",
    "applicant--type--additional_description": `Desc ${shortSuffix}`,
    ...personAnswers("contacts--point_of_contact", "CP", shortSuffix),
    "project--title": `Project ${shortSuffix}`,
    "project--areas_affected": `Areas ${shortSuffix}`,
    "applicant--congressional_district": "MD-007",
    "project--congressional_district": "MD-003",
    "project--additional_congressional_districts": TEST_UPLOAD_FILE,
    "budget--funding_period--start_date": "2030-10-01",
    "budget--funding_period--end_date": "2031-09-30",
    "budget--funding_sources--federal": "1000000.00",
    "budget--funding_sources--match": "250000.00",
    "application--state_review--status": "StateReviewNotNeeded",
    "applicant--delinquent_federal_debt--answer": "No",
    "certification--agree": "true",
    ...personAnswers("contacts--authorized_representative", "AR", shortSuffix),
    "attachments--additional": TEST_UPLOAD_FILE,
  } satisfies Partial<
    Record<keyof typeof fieldDefinitionsSF424Mandatory, string>
  >;
};

/**
 * Opportunity data for the SF424 Mandatory Form, generated from forms/specs. Seeded as
 * E2E-SF424MANDATORYG by build_automatic_opportunities.py and seed_local_db.py. Imported by
 * load-opportunity-config.ts to build the opportunity registry.
 */
export const SF424_MANDATORY_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "a8350acc-77b5-448e-b78b-2fc0002a9c88",
  opportunityNumber: "E2E-SF424MANDATORYG-ORG-IND-01",
  formKey: "sf424MandatoryGenerated",
  expectedPrepopulatedFields: {
    "opportunity--agency_name": "Simpler Grants.gov",
    "opportunity--assistance_listing--number": "10.960",
    "opportunity--assistance_listing--title":
      "Technical Agricultural Assistance",
  },
  buildTestData: buildSF424MandatoryHappyPathTestData,
};
