import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Regex matcher tolerant of hyphen/dash variants for the NEH Supplementary Cover Sheet,
// compatible with both local and staging environments.
export const SUPP_COVER_SHEET_NEH_FORM_MATCHER =
  "Supplementary\\s+Cover\\s+Sheet\\s+for\\s+NEH\\s+Grant\\s+Programs";

export const fieldDefinitionsSuppCoverSheetNEH: FormFillFieldDefinitions = {
  // ********* Section 1 - Project Director *********
  major_field: {
    selector: "#major_field",
    type: "dropdown",
    section: "Project Director",
    field: "Major Field of Study",
  },

  // ********* Section 2 - Institution Information *********
  organization_type: {
    selector: "#organization_type",
    type: "dropdown",
    section: "Institution Information",
    field: "Type",
  },

  // ********* Section 3 - Project Funding *********
  "funding_group--outright_funds": {
    testId: "funding_group--outright_funds",
    type: "text",
    section: "Project Funding",
    field: "Outright Funds",
  },
  "funding_group--federal_match": {
    testId: "funding_group--federal_match",
    type: "text",
    section: "Project Funding",
    field: "Federal Match",
  },
  "funding_group--cost_sharing": {
    testId: "funding_group--cost_sharing",
    type: "text",
    section: "Project Funding",
    field: "Cost Sharing",
  },

  // ********* Section 4 - Application Information *********
  // additional_funding is a radio button (boolean Yes/No)
  // getByText specifies which option to click; use type "radio" so it always fires
  "application_info--additional_funding": {
    getByText: "No",
    textExact: true,
    type: "radio",
    section: "Application Information",
    field: "Additional Funding",
  },
  application_type: {
    selector: "#application_info--application_type",
    type: "dropdown",
    section: "Application Information",
    field: "Type of Application",
  },
  supplemental_grant_numbers: {
    testId: "application_info--supplemental_grant_numbers",
    type: "text",
    section: "Application Information",
    field: "Supplemental Grant Numbers",
  },
  primary_project_discipline: {
    selector: "#primary_project_discipline",
    type: "dropdown",
    section: "Application Information",
    field: "Primary Project Discipline",
  },
  secondary_project_discipline: {
    selector: "#secondary_project_discipline",
    type: "dropdown",
    section: "Application Information",
    field: "Secondary Project Discipline",
  },
  tertiary_project_discipline: {
    selector: "#tertiary_project_discipline",
    type: "dropdown",
    section: "Application Information",
    field: "Tertiary Project Discipline",
  },
};

export const SUPP_COVER_SHEET_NEH_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Supplementary Cover Sheet for NEH Grant Programs",
  fields: fieldDefinitionsSuppCoverSheetNEH,
} as const;
