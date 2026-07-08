/**
 * @feature Opportunity - failure path edit opportunity
 * @featureFile e2e/opportunity/features/failure-path-edit-opportunity.feature
 * @scenario Validate cross-field checks on edit opportunity
 *
 * Reviewer guide (what happens in this test):
 * 1. Seed a valid opportunity and enter edit flow.
 * 2. Prime required fields for publish-path assertions.
 * 3. Run metadata-defined cross-field invalid combinations.
 * 4. Assert expected errors on both Save and Publish triggers.
 *
 * Tester parameter guide:
 * - Update CROSS_FIELD_VALIDATION_DEFINITIONS for invalid pairs and messages.
 * - Update CROSS_FIELD_TRIGGER_BUTTONS if trigger coverage changes.
 * - Update baseline values in opportunity-pages-fill-data.ts.
 *
 */

import { test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import {
  CROSS_FIELD_VALIDATION_DEFINITIONS,
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertCrossFieldValidationsFromDefinitions } from "tests/e2e/utils/common/cross-field-validation-utils";
import { primeEditOpportunityForPublishChecks } from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const CROSS_FIELD_TRIGGER_BUTTONS = ["Save", "Publish"];

test.describe("Opportunity failure path - edit opportunity cross-field", () => {
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
    "edit opportunity failure path - cross-field validation",
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

      //------------------------Test steps start-----------------
      // Given I create a new opportunity, open the edit page, and prime required fields.
      // Keep requiredFieldDefinitions aligned with metadata updates in
      // opportunity-pages-field-definitions.ts when required-field rules change.
      await primeEditOpportunityForPublishChecks(
        page,
        fillData,
        requiredFieldDefinitions,
      );

      // Then I verify cross-field validation from metadata.
      await assertCrossFieldValidationsFromDefinitions(
        page,
        CROSS_FIELD_VALIDATION_DEFINITIONS,
        fillData,
        {
          triggerButtonNames: CROSS_FIELD_TRIGGER_BUTTONS,
        },
      );

      //----------Test steps end-----------------
    },
  );
});
