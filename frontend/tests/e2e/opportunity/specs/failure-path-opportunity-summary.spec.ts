/**
 * @feature Opportunity Summary - Failure Path
 *
 * Notes for reviewer (what happens in this spec):
 * 1) Uses shared authenticated lifecycle hooks (one login per spec) and creates a draft opportunity per test.
 * 2) Opens the Opportunity Summary edit page from the create flow.
 * 3) Runs focused failure-path validation scenarios for:
 *    - required-field gating
 *    - negative numeric values
 *    - email format
 *    - cross-field rules
 *    - character limits
 * 4) Verifies the edit route remains stable and the expected validation state appears.
 *
 * Tester parameter guide:
 * - Dynamic values are generated in buildOpportunityHappyPathFillData(new Date()).
 * - To adjust required-field priming, update REQUIRED_FIELD_DEFINITIONS in
 *   opportunity-pages-field-definitions.
 * - To adjust validation coverage, update the relevant metadata/inputs used by:
 *   - ADDITIONAL_INFORMATION_FIELD_DEFINITIONS
 *   - CROSS_FIELD_VALIDATION_DEFINITIONS
 * - EDIT_OPPORTUNITY_URL_PATTERN is imported from opportunity-pages-field-definitions.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
  buildPageFieldsFromDefinitions,
  CROSS_FIELD_VALIDATION_DEFINITIONS,
  EDIT_FAILURE_PATH_FIELD_DEFINITIONS,
  EDIT_OPPORTUNITY_URL_PATTERN,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
  REQUIRED_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createAuthenticatedPageLifecycle } from "tests/e2e/utils/common/auth-storage-state-utils";
import { assertCharacterLimitValidationsFromDefinitions } from "tests/e2e/utils/common/character-limit-validation-utils";
import { assertCrossFieldValidationsFromDefinitions } from "tests/e2e/utils/common/cross-field-validation-utils";
import { assertEmailValidationsFromDefinitions } from "tests/e2e/utils/common/email-validation-utils";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { assertNegativeNumberValidationsFromDefinitions } from "tests/e2e/utils/common/negative-number-validation-utils";
import { assertRequiredFieldValidationsFromDefinitions } from "tests/e2e/utils/common/required-field-validation-utils";
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

async function setupAndNavigateToOpportunitySummary(page: Page) {
  const fillData = buildOpportunityHappyPathFillData(new Date());

  // Given I create a new opportunity with all required fields filled in
  await createOpportunity(page, fillData);

  // And I click "Opportunity Summary" link
  await page.getByRole("link", { name: "Opportunity Summary" }).click();

  // And I should be on the edit opportunity summary page
  await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);

  // And I should see the "Save and exit", "Save and go back", and "Save and continue" buttons enabled.
  await assertButtonEnabledDisabledStates(page, {
    "Save and exit": true,
    "Save and go back": true,
    "Save and continue": true,
  });

  return fillData;
}

test.describe("Grantor Opportunity Summary Failure Path", () => {
  // One-login-per-spec lifecycle shared across failure-path specs.
  const authenticatedLifecycle = createAuthenticatedPageLifecycle({
    targetEnv,
    skipTest: (condition, description) => test.skip(condition, description),
  });

  test.beforeAll(authenticatedLifecycle.beforeAll);
  test.beforeEach(authenticatedLifecycle.beforeEach);
  test.afterEach(authenticatedLifecycle.afterEach);

  test(
    "Required-field validation",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async () => {
      //--------------Test setup start here----------------
      const testPage = authenticatedLifecycle.getPage();
      await setupAndNavigateToOpportunitySummary(testPage);

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then required-field validation errors are shown on the page.
      // Note: The required-field validation helper asserts the page URL pattern after each trigger button click.
      await assertRequiredFieldValidationsFromDefinitions(
        testPage,
        REQUIRED_FIELD_DEFINITIONS,
        {
          triggerButtonNames: ["Save and exit"],
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );

  test(
    "Negative number validation",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async () => {
      //--------------Test setup start here----------------
      const testPage = authenticatedLifecycle.getPage();
      const fillData = await setupAndNavigateToOpportunitySummary(testPage);

      // Prime required fields to isolate negative-number assertions from
      // unrelated required-field gating errors.
      await fillPageFields(
        testPage,
        buildPageFieldsFromDefinitions(
          REQUIRED_FIELD_DEFINITIONS.filter((field) => field.required),
          fillData,
        ),
      );

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then negative number validation errors are shown on the page.
      // Note: The negative-number validation helper asserts the page URL pattern after each trigger button click.
      await assertNegativeNumberValidationsFromDefinitions(
        testPage,
        FUNDING_DETAILS_FIELD_DEFINITIONS,
        fillData,
        {
          negativeValue: "-10",
          triggerValidationWithButtonClick: false,
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );

  test(
    "Email format validation",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async () => {
      //--------------Test setup start here----------------
      const testPage = authenticatedLifecycle.getPage();
      const fillData = await setupAndNavigateToOpportunitySummary(testPage);

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then email format validation errors are shown on the page.
      // Note: The email-validation helper asserts the page URL pattern after each trigger button click.
      await assertEmailValidationsFromDefinitions(
        testPage,
        ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
        fillData,
        {
          invalidEmail: "ABC",
          triggerButtonNames: ["Save and exit"],
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );

  test(
    "Cross-field validation",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async () => {
      //--------------Test setup start here----------------
      const testPage = authenticatedLifecycle.getPage();
      const fillData = await setupAndNavigateToOpportunitySummary(testPage);

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then cross-field validation errors are shown on the page.
      // Note: The cross-field validation helper asserts the page URL pattern after each trigger button click.
      await assertCrossFieldValidationsFromDefinitions(
        testPage,
        CROSS_FIELD_VALIDATION_DEFINITIONS,
        fillData,
        {
          triggerButtonNames: ["Save and exit"],
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );

  test(
    "Character limits validation",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async () => {
      //--------------Test setup start here----------------
      const testPage = authenticatedLifecycle.getPage();
      const fillData = await setupAndNavigateToOpportunitySummary(testPage);

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then character limits validation errors are shown on the page.
      // Note: The character limits validation helper asserts the page URL pattern after each trigger button click.
      await assertCharacterLimitValidationsFromDefinitions(
        testPage,
        EDIT_FAILURE_PATH_FIELD_DEFINITIONS,
        fillData,
        {
          buildPageFields: buildPageFieldsFromDefinitions,
          triggerButtonNames: ["Save and exit"],
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );
});
