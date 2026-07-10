/**
 * Test data for Supplementary Cover Sheet for NEH Grant Programs happy path.
 *
 * Keys must match exactly the field keys defined in
 * SUPP_COVER_SHEET_NEH_FORM_CONFIG.fields in
 * supp-cover-sheet-neh-grantsprogram-field-definitions.ts.
 *
 * additional_funding is "false" (radio: No) so the explanation field is still
 * filled to validate it renders correctly. If additional_funding were "true",
 * the explanation would be required by the schema.
 */
export const suppCoverSheetNEHHappyPathTestData: Record<string, string> = {
  // Section 1 - Project Director
  major_field: "Arts: General",

  // Section 2 - Institution Information
  organization_type: "1326: Center For Advanced Study/Research Institute",

  // Section 3 - Project Funding
  "funding_group--outright_funds": "1",
  "funding_group--federal_match": "1",
  "funding_group--cost_sharing": "1",

  // Section 4 - Application Information
  // Radio: No - additional_funding = false
  "application_info--additional_funding": "false",
  application_type: "New",
  supplemental_grant_numbers: "Test Grant Numbers",
  primary_project_discipline: "Arts: General",
  secondary_project_discipline: "Arts: General",
  tertiary_project_discipline: "Arts: General",
};
