/**
 * @feature Opportunity - failure path edit opportunity
 * @featureFile e2e/opportunity/features/failure-path-edit-opportunity.feature
 * @scenario Validate negative-number checks on edit opportunity
 *
 * Reviewer guide (what happens in this test):
 * 1. Seed a valid opportunity and open edit flow.
 * 2. Prime required fields for stable edit-page state.
 * 3. Apply negative values to numeric fields from metadata.
 * 4. Verify negative-number messages after Save.
 *
 * Tester parameter guide:
 * - Update NEGATIVE_TEST_VALUE to adjust invalid numeric input.
 * - Update NUMERIC_TRIGGER_BUTTONS to change trigger behavior.
 * - Update FUNDING_DETAILS_FIELD_DEFINITIONS metadata/messages.
 * - Update baseline values in opportunity-pages-fill-data.ts.
 *
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertNegativeNumberValidationsFromDefinitions } from "tests/e2e/utils/common/negative-number-validation-utils";
import { primeEditOpportunityForPublishChecks } from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const NEGATIVE_TEST_VALUE = "-10";
const NUMERIC_TRIGGER_BUTTONS = ["Save"];

test.describe("Opportunity failure path - edit opportunity numeric", () => {
  //-----------------------Test setup-----------------
  // Skip non-Chrome browsers in staging.
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "edit opportunity failure path - negative number validation",
    { tag: [GRANTOR, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      await authenticateE2eUser(
        page,
        context,
        !!testInfo.project.name.match(/[Mm]obile/),
      );

      const fillData = buildOpportunityHappyPathFillData(new Date());
      const requiredFieldDefinitions = [
        ...FUNDING_DETAILS_FIELD_DEFINITIONS,
        ...ELIGIBILITY_FIELD_DEFINITIONS,
      ];
      const numericNegativeValidationDefinitions =
        FUNDING_DETAILS_FIELD_DEFINITIONS;

      //------------------------Test steps start-----------------
      // Given I create a new opportunity, open the edit page, and prime required fields.
      // Keep requiredFieldDefinitions aligned with metadata updates in
      // opportunity-pages-field-definitions.ts when required-field rules change.
      await primeEditOpportunityForPublishChecks(
        page,
        fillData,
        requiredFieldDefinitions,
      );

      // Then I verify negative-number validation messages using metadata definitions and shared utility.
      await assertNegativeNumberValidationsFromDefinitions(
        page,
        numericNegativeValidationDefinitions,
        fillData,
        {
          negativeValue: NEGATIVE_TEST_VALUE,
          triggerButtonNames: NUMERIC_TRIGGER_BUTTONS,
        },
      );

      //----------Test steps end-----------------
    },
  );
});
