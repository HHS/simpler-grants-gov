/**
 * @feature Opportunity Summary - Failure Path
 *
 * Notes for reviewer (what happens in this spec):
 * 1) Authenticates a grantor user and creates a draft opportunity per test.
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
 * - To adjust required-field priming, update fixture inputs/definitions used by:
 *   - FUNDING_DETAILS_FIELD_DEFINITIONS
 *   - ELIGIBILITY_FIELD_DEFINITIONS
 * - To adjust validation coverage, update the relevant metadata/inputs used by:
 *   - ADDITIONAL_INFORMATION_FIELD_DEFINITIONS
 *   - CROSS_FIELD_VALIDATION_DEFINITIONS
 * - Scenario-specific invalid inputs are controlled by constants in this spec.
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
  buildPageFieldsFromDefinitions,
  CROSS_FIELD_VALIDATION_DEFINITIONS,
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertCharacterLimitValidationsFromDefinitions } from "tests/e2e/utils/common/character-limit-validation-utils";
import { assertCrossFieldValidationsFromDefinitions } from "tests/e2e/utils/common/cross-field-validation-utils";
import { assertEmailValidationsFromDefinitions } from "tests/e2e/utils/common/email-validation-utils";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { assertNegativeNumberValidationsFromDefinitions } from "tests/e2e/utils/common/negative-number-validation-utils";
import { assertRequiredFieldValidationsFromDefinitions } from "tests/e2e/utils/common/required-field-validation-utils";
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";
import { EDIT_OPPORTUNITY_URL_PATTERN } from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const REQUIRED_FIELD_DEFINITIONS = [
  ...FUNDING_DETAILS_FIELD_DEFINITIONS,
  ...ELIGIBILITY_FIELD_DEFINITIONS,
];
const NEGATIVE_TEST_VALUE = "-10";
async function authenticateAndBuildFillData(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
) {
  testInfo.setTimeout(300_000);

  await authenticateE2eUser(
    page,
    context,
    !!testInfo.project.name.match(/[Mm]obile/),
  );

  return buildOpportunityHappyPathFillData(new Date());
}

async function setupAndNavigateToOpportunitySummary(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
) {
  const fillData = await authenticateAndBuildFillData(page, context, testInfo);

  // Given I create a new opportunity with all required fields filled in
  await createOpportunity(page, fillData);

  // And I click "Opportunity Summary" link
  await page.getByRole("link", { name: "Opportunity Summary" }).click();

  // Then I should be on the "Opportunity Summary" page.
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
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Required-field validation",
    { tag: [GRANTOR, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      //--------------Test setup start here----------------
      await setupAndNavigateToOpportunitySummary(page, context, testInfo);

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then required-field validation errors are shown on the page.
      // Note: The required-field validation helper asserts the page URL pattern after each trigger button click.
      await assertRequiredFieldValidationsFromDefinitions(
        page,
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
    { tag: [GRANTOR, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      //--------------Test setup start here----------------
      const fillData = await setupAndNavigateToOpportunitySummary(
        page,
        context,
        testInfo,
      );

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then negative number validation errors are shown on the page.
      // Note: The negative-number validation helper asserts the page URL pattern after each trigger button click.
      await assertNegativeNumberValidationsFromDefinitions(
        page,
        FUNDING_DETAILS_FIELD_DEFINITIONS,
        fillData,
        {
          negativeValue: NEGATIVE_TEST_VALUE,
          triggerButtonNames: ["Save and exit"],
          pageUrlPattern: EDIT_OPPORTUNITY_URL_PATTERN,
        },
      );

      //--------------Scenario steps end here----------------
    },
  );

  test(
    "Email format validation",
    { tag: [GRANTOR, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      //--------------Test setup start here----------------
      const fillData = await setupAndNavigateToOpportunitySummary(
        page,
        context,
        testInfo,
      );

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then email format validation errors are shown on the page.
      // Note: The email-validation helper asserts the page URL pattern after each trigger button click.
      await assertEmailValidationsFromDefinitions(
        page,
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
    { tag: [GRANTOR, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      //--------------Test setup start here----------------
      const fillData = await setupAndNavigateToOpportunitySummary(
        page,
        context,
        testInfo,
      );

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then cross-field validation errors are shown on the page.
      // Note: The cross-field validation helper asserts the page URL pattern after each trigger button click.
      await assertCrossFieldValidationsFromDefinitions(
        page,
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
    { tag: [GRANTOR, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      //--------------Test setup start here----------------
      const fillData = await setupAndNavigateToOpportunitySummary(
        page,
        context,
        testInfo,
      );

      //--------------Scenario steps start here----------------
      // When I click the configured trigger button
      // Then character limits validation errors are shown on the page.
      // Note: The character limits validation helper asserts the page URL pattern after each trigger button click.
      const editFailurePathFieldDefinitions = [
        ...REQUIRED_FIELD_DEFINITIONS,
        ...ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
      ];

      await assertCharacterLimitValidationsFromDefinitions(
        page,
        editFailurePathFieldDefinitions,
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
