import type { FillFormConfig } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const SBIR_STTR_FORM_MATCHER = /SBIR\/STTR Information/i;
export const SBIR_STTR_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: SBIR_STTR_FORM_MATCHER,
  fields: {
    agency: {
      selector: "#agency",
      type: "dropdown",
      field: "Agency to which you are applying (select only one)",
      printTestId: "agency",
    },
    sbc_control_id: {
      selector: "#sbc_control_id",
      type: "text",
      field: "SBC Control ID:",
      printTestId: "sbc_control_id",
    },
    program_type: {
      selector: "#program_type",
      type: "dropdown",
      field: "Program Type (select only one)",
      printTestId: "program_type",
    },
    application_type: {
      selector: "#application_type",
      type: "dropdown",
      field: "Application Type (select only one)",
      printTestId: "application_type",
    },
    eligibility_certification: {
      selector: 'input[name="eligibility_certification"][value="true"]',
      type: "radiobutton",
      field:
        "1a. Do you certify that at the time of award your organization will meet the eligibility criteria for a small business as defined in the funding opportunity announcement?",
      printTestId: "eligibility_certification",
    },
    anticipated_personnel: {
      selector: "#anticipated_personnel",
      type: "text",
      field:
        "1b. Anticipated Number of personnel to be employed at your organization at the time of award.",
      printTestId: "anticipated_personnel",
    },
    majority_venture_capital_owned: {
      selector: 'input[name="majority_venture_capital_owned"][value="false"]',
      type: "radiobutton",
      field:
        "1c. Is your small business majority owned by venture capital operating companies, hedge funds, or private equity firms?",
      printTestId: "majority_venture_capital_owned",
    },
    faculty_or_student_owned: {
      selector: 'input[name="faculty_or_student_owned"][value="false"]',
      type: "radiobutton",
      field: "1d. Is your small business a Faculty or Student-Owned entity?",
      printTestId: "faculty_or_student_owned",
    },
    federal_subcontracts_included: {
      selector: 'input[name="federal_subcontracts_included"][value="false"]',
      type: "radiobutton",
      field:
        "2. Does this application include subcontracts with Federal laboratories or any other Federal Government agencies?",
      printTestId: "federal_subcontracts_included",
    },
    hub_zone_located: {
      selector: 'input[name="hub_zone_located"][value="false"]',
      type: "radiobutton",
      field: "3. Are you located in a HUBZone?",
      printTestId: "hub_zone_located",
    },
    research_entirely_in_united_states: {
      selector:
        'input[name="research_entirely_in_united_states"][value="true"]',
      type: "radiobutton",
      field:
        "4. Will all research and development on the project be performed in its entirety in the United States?",
      printTestId: "research_entirely_in_united_states",
    },
    equivalent_federal_work: {
      selector: 'input[name="equivalent_federal_work"][value="false"]',
      type: "radiobutton",
      field:
        "5. Has the applicant and/or Program Director/Principal Investigator submitted proposals for essentially equivalent work under other Federal program solicitations or received other Federal awards for essentially equivalent work?",
      printTestId: "equivalent_federal_work",
    },
    disclosure_permitted: {
      selector: 'input[name="disclosure_permitted"][value="false"]',
      type: "radiobutton",
      field:
        "6. Disclosure Permission Statement: If this application does not result in an award, is the Government permitted to disclose the title of your proposed project, and the name, address, telephone number and email address of the official signing for the applicant organization to state-level economic development organizations that may be interested in contacting you for further information (e.g., possible collaborations, investment)?",
      printTestId: "disclosure_permitted",
    },
    taba_funds_requested: {
      selector: 'input[name="taba_funds_requested"][value="false"]',
      type: "radiobutton",
      field:
        "7. Does the application include a request of SBIR or STTR funds for Technical and Business Assistance (TABA)? If yes, please follow the agency specific instructions to provide the budget request and justification. (Please answer no if you plan to use the agency TABA vendor, which does not require you to include a request for TABA funds in your application.)",
      printTestId: "taba_funds_requested",
    },
    phase_ii_awards_received: {
      selector: 'input[name="phase_ii_awards_received"][value="false"]',
      type: "radiobutton",
      field:
        "9. Have you received SBIR Phase II awards from the Federal Government? If yes, provide a company commercialization history in accordance with agency-specific instructions using this attachment.",
      printTestId: "phase_ii_awards_received",
    },
    principal_investigator_primary_employment: {
      selector:
        'input[name="principal_investigator_primary_employment"][value="false"]',
      type: "radiobutton",
      field:
        "10. Will the Project Director/Principal Investigator have his/her primary employment with the small business at the time of award?",
      printTestId: "principal_investigator_primary_employment",
    },
  },
} satisfies FillFormConfig;
export const SBIR_STTR_REQUIRED_FIELD_ERRORS = [
  {
    fieldId: "agency",
    message: "Agency to which you are applying (select only one) is required",
  },
  {
    fieldId: "sbc_control_id",
    message: "SBC Control ID is required",
  },
  {
    fieldId: "program_type",
    message: "Program Type (select only one) is required",
  },
  {
    fieldId: "application_type",
    message: "Application Type (select only one) is required",
  },
  {
    fieldId: "eligibility_certification",
    message:
      "1a. Do you certify that at the time of award your organization will meet the eligibility criteria for a small business as defined in the funding opportunity announcement is required",
  },
  {
    fieldId: "anticipated_personnel",
    message:
      "1b. Anticipated Number of personnel to be employed at your organization at the time of award is required",
  },
  {
    fieldId: "majority_venture_capital_owned",
    message:
      "1c. Is your small business majority owned by venture capital operating companies, hedge funds, or private equity firms is required",
  },
  {
    fieldId: "faculty_or_student_owned",
    message:
      "1d. Is your small business a Faculty or Student-Owned entity is required",
  },
  {
    fieldId: "federal_subcontracts_included",
    message:
      "2. Does this application include subcontracts with Federal laboratories or any other Federal Government agencies is required",
  },
  {
    fieldId: "hub_zone_located",
    message: "3. Are you located in a HUBZone is required",
  },
  {
    fieldId: "research_entirely_in_united_states",
    message:
      "4. Will all research and development on the project be performed in its entirety in the United States is required",
  },
  {
    fieldId: "equivalent_federal_work",
    message:
      "5. Has the applicant and/or Program Director/Principal Investigator submitted proposals for essentially equivalent work under other Federal program solicitations or received other Federal awards for essentially equivalent work is required",
  },
  {
    fieldId: "disclosure_permitted",
    message:
      "6. Disclosure Permission Statement: If this application does not result in an award, is the Government permitted to disclose the title of your proposed project, and the name, address, telephone number and email address of the official signing for the applicant organization to state-level economic development organizations that may be interested in contacting you for further information (e.g., possible collaborations, investment) is required",
  },
  {
    fieldId: "taba_funds_requested",
    message:
      "7. Does the application include a request of SBIR or STTR funds for Technical and Business Assistance (TABA)? If yes, please follow the agency specific instructions to provide the budget request and justification. (Please answer no if you plan to use the agency TABA vendor, which does not require you to include a request for TABA funds in your application.) is required",
  },
];
