import {
  buildValidationConfig,
  FieldConfigOverrides,
} from "tests/e2e/utils/field-validation/utils/build-validation-config";
import { fieldDefinitionsSF424 } from "tests/e2e/apply/fixtures/sf424-field-definitions";

/**
 * Overrides for the SF-424 field validation config.
 *
 * Keys match the field definition keys in fieldDefinitionsSF424.
 * Values supply only what the DOM cannot communicate automatically:
 *   - errorLocator   → CSS selector for the inline error element
 *   - validationMode → "inline-error" when exceeding max shows an error element
 *                      (defaults to "truncate" for most fields)
 *   - type           → refined input type ("tel", "email"); FillFieldDefinition
 *                      only distinguishes "text" from non-text
 *   - pattern        → explicit regex (monetary string fields)
 *   - skip: true     → exclude fields typed as "text" that cannot be
 *                      boundary-tested (date pickers, hidden conditional fields)
 *
 * Everything else (maxLength, minLength, min, max, required) is read from the
 * live DOM at runtime via autoDetectConstraints — no manual duplication of the
 * API schema values is needed.
 *
 * Non-text field types (dropdown, file, radiobutton, checkbox, combo-box-input)
 * are automatically excluded by buildValidationConfig and do not need skip: true.
 */
const SF424_OVERRIDES: FieldConfigOverrides = {
  // ── Skip: date pickers (typed as "text" in field definitions) ──────────────
  project_start_date: { skip: true },
  project_end_date: { skip: true },
  state_review_available_date: { skip: true },

  // ── Skip: conditional field (only rendered when revision_type = "E: Other") ─
  revision_other_specify: { skip: true },

  // ── Required fields with inline error elements ──────────────────────────────
  organization_name: {
    errorLocator: "#error-for-organization_name",
  },
  employer_taxpayer_identification_number: {
    validationMode: "inline-error",
    errorLocator: "#error-for-employer_taxpayer_identification_number",
  },
  applicant_street1: {
    errorLocator: "#error-for-applicant--street1",
  },
  applicant_city: {
    errorLocator: "#error-for-applicant--city",
  },
  contact_person_first_name: {
    errorLocator: "#error-for-contact_person--first_name",
  },
  contact_person_last_name: {
    errorLocator: "#error-for-contact_person--last_name",
  },
  phone_number: {
    type: "tel",
    errorLocator: "#error-for-phone_number",
  },
  fax: {
    type: "tel",
  },
  email: {
    type: "email",
    validationMode: "inline-error",
    errorLocator: "#error-for-email",
  },
  project_title: {
    errorLocator: "#error-for-project_title",
  },
  congressional_district_applicant: {
    errorLocator: "#error-for-congressional_district_applicant",
  },
  congressional_district_program_project: {
    errorLocator: "#error-for-congressional_district_program_project",
  },

  // ── Monetary string fields (budget_monetary_amount pattern) ─────────────────
  // Pattern mirrors common_shared.py: ^(-)?d*([.]d{2})?$
  federal_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-federal_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },
  applicant_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-applicant_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },
  state_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-state_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },
  local_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-local_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },
  other_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-other_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },
  program_income_estimated_funding: {
    validationMode: "inline-error",
    errorLocator: "#error-for-program_income_estimated_funding",
    pattern: /^(-)?(\d+)([.]\d{2})?$/,
  },

  // ── Authorized representative ────────────────────────────────────────────────
  authorized_representative_first_name: {
    errorLocator: "#error-for-authorized_representative--first_name",
  },
  authorized_representative_last_name: {
    errorLocator: "#error-for-authorized_representative--last_name",
  },
  authorized_representative_title: {
    errorLocator: "#error-for-authorized_representative_title",
  },
  authorized_representative_phone_number: {
    type: "tel",
    errorLocator: "#error-for-authorized_representative_phone_number",
  },
  authorized_representative_fax: {
    type: "tel",
  },
  authorized_representative_email: {
    type: "email",
    validationMode: "inline-error",
    errorLocator: "#error-for-authorized_representative_email",
  },
};

export const SF424_VALIDATION_CONFIG = buildValidationConfig(
  fieldDefinitionsSF424,
  SF424_OVERRIDES,
);
