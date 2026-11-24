import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

export const SBIR_STTR_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "d6310a13-d725-5af5-82b6-c1a3853b1a43",
  opportunityNumber: "E2E-SBIR-ORG-IND-01",
  formKey: "sbirSttrGenerated",
  expectedPrepopulatedFields: {},
  buildTestData: () => ({
    agency: "HHS",
    sbc_control_id: "001234567",
    program_type: "SBIR",
    application_type: "Phase I",
    eligibility_certification: "Yes",
    anticipated_personnel: "2",
    majority_venture_capital_owned: "No",
    faculty_or_student_owned: "No",
    federal_subcontracts_included: "No",
    hub_zone_located: "No",
    research_entirely_in_united_states: "Yes",
    equivalent_federal_work: "No",
    disclosure_permitted: "No",
    taba_funds_requested: "No",
    phase_ii_awards_received: "No",
    principal_investigator_primary_employment: "No",
  }),
};
