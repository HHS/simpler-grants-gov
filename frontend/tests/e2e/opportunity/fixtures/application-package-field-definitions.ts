/**
 * Competition/application-package metadata definitions and page-field mapping helpers.
 * Usage:
 * - import { buildPageFieldsFromDefinitions } from "tests/e2e/opportunity/fixtures/application-package-field-definitions";
 * - import { buildApplicationPackageHappyPathFillData } from "tests/e2e/opportunity/fixtures/application-package-fill-data";
 *
 * Reviewer guide:
 * - This fixture is the source of truth for field selectors, value keys,
 *   and validation messages used by competition-page tests.
 * - Prefer metadata changes here over hardcoded values in spec files.
 *
 * Tester parameter guide:
 * - Submission setup fields: APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS.
 * - Submission window fields: APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS.
 * - Agency contact fields: APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS.
 * - Combined fields: APPLICATION_PACKAGE_FIELD_DEFINITIONS.
 */

import { buildPageFieldsFromDefinitions as buildSharedPageFieldsFromDefinitions } from "tests/e2e/utils/common/build-page-fields-from-definitions";
import {
  type MetadataPageFieldDefinition,
  type ValidationMetadata,
} from "tests/e2e/utils/common/types";

/** Keys supported by the competition/application-package fill-data object. */
export type ApplicationPackageFieldValueKey =
  | "competitionId"
  | "competitionTitle"
  | "whoCanApply"
  | "submissionsOpen"
  | "submissionsClose"
  | "expectedNumberOfApplicants"
  | "fullName"
  | "title"
  | "emailAddress"
  | "phoneNumber";

/** Metadata describing how a single UI field should be filled and validated. */
export type ApplicationPackagePageFieldDefinition =
  MetadataPageFieldDefinition<ApplicationPackageFieldValueKey> &
    ValidationMetadata;

/** Builds page-fill fields from metadata definitions and a value dictionary. */
export const buildPageFieldsFromDefinitions = (
  definitions: ApplicationPackagePageFieldDefinition[],
  fillData: Record<ApplicationPackageFieldValueKey, string>,
  // Preserve legacy import path while delegating to the shared builder.
) => buildSharedPageFieldsFromDefinitions(definitions, fillData);

/** Submission set-up fields from the competition page. */
export const APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS: ApplicationPackagePageFieldDefinition[] =
  [
    {
      label: "Competition ID",
      type: "text",
      valueKey: "competitionId",
      selector: "#competition-id",
      required: false,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Competition title",
      type: "text",
      valueKey: "competitionTitle",
      selector: "#competition-title",
      required: false,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Who can apply?",
      type: "select",
      valueKey: "whoCanApply",
      selector: "#who-can-apply",
      required: true,
    },
  ];

/** Submission window fields from the competition page. */
export const APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS: ApplicationPackagePageFieldDefinition[] =
  [
    {
      label: "Submissions open",
      type: "date",
      valueKey: "submissionsOpen",
      selector: "#submissions-open",
      required: false,
    },
    {
      label: "Submissions close",
      type: "date",
      valueKey: "submissionsClose",
      selector: "#submissions-close",
      required: true,
    },
    {
      label: "Expected number of applicants",
      type: "text",
      valueKey: "expectedNumberOfApplicants",
      selector: "#expected-number-of-applicants",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
  ];

/** Agency contact fields from the competition page. */
export const APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS: ApplicationPackagePageFieldDefinition[] =
  [
    {
      label: "Full name",
      type: "text",
      valueKey: "fullName",
      selector: "#fullName",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
      requiredFieldMessage: "Full name is required.",
      inlineErrorSelector: "#error-for-fullName",
    },
    {
      label: "Title",
      type: "text",
      valueKey: "title",
      selector: "#title",
      required: false,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Email address",
      type: "email",
      valueKey: "emailAddress",
      selector: "#emailAddress",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
      requiredFieldMessage: "Email address is required.",
      emailValidationMessage:
        "Incorrect text format. Please ensure there are no spaces or missing characters.",
      inlineErrorSelector: "#error-for-emailAddress",
    },
    {
      label: "Phone number",
      type: "text",
      valueKey: "phoneNumber",
      selector: "#phoneNumber",
      required: true,
      maxLength: 14,
      characterLimitValidationMessage: "1 character over limit",
      requiredFieldMessage: "Phone number is required.",
      inlineErrorSelector: "#error-for-phoneNumber",
    },
  ];

/** Combined field definitions for the competition/application-package page. */
export const APPLICATION_PACKAGE_FIELD_DEFINITIONS: ApplicationPackagePageFieldDefinition[] =
  [
    ...APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS,
    ...APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS,
    ...APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS,
  ];
