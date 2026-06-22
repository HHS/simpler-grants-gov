import { test as base } from "@playwright/test";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";
import { extractRequiredFieldErrorsFromApi } from "tests/e2e/utils/forms/extract-required-field-errors";
import { CD511_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/cd511-field-definitions";
import { EPA_KEY_CONTACTS_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/epa-key-contacts-field-definitions";
import { GRANTSGOV_LOBBYING_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/grantsgov-lobbying-field-definitions";
import { PROJECT_ABSTRACT_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/project-abstract-field-definitions";
import { SF424_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import { SF424A_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/sf424a-field-definitions";
import { SFLLL_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/sfLLL-field-definitions";
import { SF424B_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/sf424b-field-definitions";
import { SF424D_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/sf424d-field-definitions";
import { EPA4700_4_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/epa4700-4-field-definitions";
import { SUPP_COVER_SHEET_NEH_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/supp-cover-sheet-neh-grantsprogram-field-definitions";
import { PROJECT_ABSTRACT_SUMMARY_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import { PROJECT_NARRATIVE_ATTACHMENT_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/project-narrative-attachment-field-definitions";
import { OTHER_NARRATIVE_ATTACHMENT_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/other-narrative-attachment-field-definitions";
import { BUDGET_NARRATIVE_ATTACHMENT_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/budget-narrative-attachment-field-definitions";
import { ATTACHMENT_FIELD_ID_MAP } from "tests/e2e/apply/fixtures/attachment-field-definitions";

/**
 * Playwright fixtures for form validation error messages.
 * Each fixture fetches the form schema from the API and generates
 * the expected error messages for required fields.
 *
 * Field ID maps are stored in individual form fixture files and imported here.
 *
 * Usage:
 *   test("my test", async ({ cd511RequiredErrors }) => {
 *     // cd511RequiredErrors is automatically loaded
 *   });
 */

type FormValidationFixtures = {
  cd511RequiredErrors: FieldError[];
  epaRequiredErrors: FieldError[];
  grantsgovLobbyingRequiredErrors: FieldError[];
  projectAbstractRequiredErrors: FieldError[];
  sf424RequiredErrors: FieldError[];
  sf424aRequiredErrors: FieldError[];
  sflllRequiredErrors: FieldError[];
  sf424bRequiredErrors: FieldError[];
  sf424dRequiredErrors: FieldError[];
  epa4700_4RequiredErrors: FieldError[];
  suppCoverSheetNehRequiredErrors: FieldError[];
  projectAbstractSummaryRequiredErrors: FieldError[];
  projectNarrativeAttachmentRequiredErrors: FieldError[];
  otherNarrativeAttachmentRequiredErrors: FieldError[];
  budgetNarrativeAttachmentRequiredErrors: FieldError[];
  attachmentRequiredErrors: FieldError[];
};

/**
 * Extended test object with form validation error fixtures
 */
export const test = base.extend<FormValidationFixtures>({
  cd511RequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "cd511",
      CD511_FIELD_ID_MAP,
    );
    await use(errors);
  },

  epaRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "epa-key-contacts",
      EPA_KEY_CONTACTS_FIELD_ID_MAP,
    );
    await use(errors);
  },

  grantsgovLobbyingRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "grantsgov-lobbying",
      GRANTSGOV_LOBBYING_FIELD_ID_MAP,
    );
    await use(errors);
  },

  projectAbstractRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "project-abstract",
      PROJECT_ABSTRACT_FIELD_ID_MAP,
    );
    await use(errors);
  },

  sf424RequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "sf424",
      SF424_FIELD_ID_MAP,
    );
    await use(errors);
  },

  sf424aRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "sf424a",
      SF424A_FIELD_ID_MAP,
    );
    await use(errors);
  },

  sflllRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "sflll",
      SFLLL_FIELD_ID_MAP,
    );
    await use(errors);
  },

  sf424bRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "sf424b",
      SF424B_FIELD_ID_MAP,
    );
    await use(errors);
  },

  sf424dRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "sf424d",
      SF424D_FIELD_ID_MAP,
    );
    await use(errors);
  },

  epa4700_4RequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "epa4700-4",
      EPA4700_4_FIELD_ID_MAP,
    );
    await use(errors);
  },

  suppCoverSheetNehRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "supp-cover-sheet-neh",
      SUPP_COVER_SHEET_NEH_FIELD_ID_MAP,
    );
    await use(errors);
  },

  projectAbstractSummaryRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "project-abstract-summary",
      PROJECT_ABSTRACT_SUMMARY_FIELD_ID_MAP,
    );
    await use(errors);
  },

  projectNarrativeAttachmentRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "project-narrative-attachment",
      PROJECT_NARRATIVE_ATTACHMENT_FIELD_ID_MAP,
    );
    await use(errors);
  },

  otherNarrativeAttachmentRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "other-narrative-attachment",
      OTHER_NARRATIVE_ATTACHMENT_FIELD_ID_MAP,
    );
    await use(errors);
  },

  budgetNarrativeAttachmentRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "budget-narrative-attachment",
      BUDGET_NARRATIVE_ATTACHMENT_FIELD_ID_MAP,
    );
    await use(errors);
  },

  attachmentRequiredErrors: async ({}, use) => {
    const errors = await extractRequiredFieldErrorsFromApi(
      "attachment",
      ATTACHMENT_FIELD_ID_MAP,
    );
    await use(errors);
  },
});

export { expect } from "@playwright/test";
