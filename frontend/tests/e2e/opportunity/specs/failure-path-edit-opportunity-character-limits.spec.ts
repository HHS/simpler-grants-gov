/**
 * @feature Opportunity - failure path edit opportunity
 * @featureFile e2e/opportunity/features/failure-path-edit-opportunity.feature
 * @scenario Validate character limits on edit opportunity
 *
 * Reviewer guide (what happens in this test):
 * 1. Seed a valid opportunity and enter edit flow.
 * 2. Prime required fields to make Publish available for validation checks.
 * 3. Fill character-limited fields with maxLength + 1 values.
 * 4. Verify same character-limit behavior on Save and Publish.
 *
 * Tester parameter guide:
 * - Update character-limit metadata in ADDITIONAL_INFORMATION_FIELD_DEFINITIONS
 *   and required-field metadata in FUNDING_DETAILS/ELIGIBILITY definitions.
 * - Update baseline values in opportunity-pages-fill-data.ts.
 * - If trigger behavior changes, update SAVE_BUTTON_NAME/PUBLISH_BUTTON_NAME.
 *
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
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  assertButtonEnabledDisabledStates,
  assertCharacterLimitMessageCount,
  buildOverLimitFillData,
  getCharacterLimitedFields,
} from "tests/e2e/utils/common/index";
import {
  EDIT_OPPORTUNITY_URL_PATTERN,
  primeEditOpportunityForPublishChecks,
} from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const SAVE_BUTTON_NAME = "Save";
const PUBLISH_BUTTON_NAME = "Publish";

test.describe("Opportunity failure path - edit opportunity character limits", () => {
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
    "edit opportunity failure path - character limits validation",
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
      const editFailurePathFieldDefinitions = [
        ...requiredFieldDefinitions,
        ...ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
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

      // When I fill over-limit values
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          editFailurePathFieldDefinitions,
          buildOverLimitFillData(editFailurePathFieldDefinitions, fillData),
        ),
      );

      // And I click Save.
      await page.getByRole("button", { name: SAVE_BUTTON_NAME }).click();

      // Then I remain on edit page and see character-limit validation.
      await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Preview: false,
        Publish: true,
      });
      await assertCharacterLimitMessageCount(
        page,
        editFailurePathFieldDefinitions,
        getCharacterLimitedFields(editFailurePathFieldDefinitions).length,
      );

      // When I click Publish.
      await page.getByRole("button", { name: PUBLISH_BUTTON_NAME }).click();

      // Then I remain on edit page
      await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);

      // And I verify character-limit validation messages remain visible.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Preview: false,
        Publish: true,
      });

      // And I verify character-limit validation messages remain visible.
      await assertCharacterLimitMessageCount(
        page,
        editFailurePathFieldDefinitions,
        getCharacterLimitedFields(editFailurePathFieldDefinitions).length,
      );

      //----------Test steps end-----------------
    },
  );
});
