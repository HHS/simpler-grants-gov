/**
 * @feature Opportunity - failure path create opportunity
 * @featureFile e2e/opportunity/features/failure-path-create-opportunity.feature
 * @scenario Validate duplicate data, required fields, and character limits on create opportunity
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  buildPageFieldsFromDefinitions,
  CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  assertButtonEnabledDisabledStates,
  assertCharacterLimitMessageCount,
  assertDuplicateValidationMessages,
  buildOverLimitFillData,
  fillRequiredFieldsAndAssertButtonState,
  getCharacterLimitedFields,
} from "tests/e2e/utils/common/index";
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

const openFreshCreateOpportunityForm = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/grantor\/opportunities/);
  await page.getByRole("link", { name: "Create Opportunity" }).click();
  await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);
};

test.describe("Opportunity failure path - create opportunity", () => {
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
    "Create opportunity failure path - required fields validation and button enable/disable states",
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

      //------------------------Test steps start-----------------
      // Given I create a new opportunity.
      await createOpportunity(page, fillData);

      // When I start a second create flow with duplicate values.
      await page.goto("/grantor/opportunities");
      await expect(page).toHaveURL(/\/grantor\/opportunities/);
      await page.getByRole("link", { name: "Create Opportunity" }).click();
      await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
          fillData,
        ),
      );

      // And I click "Save and continue" button
      await page.getByRole("button", { name: "Save and continue" }).click();

      // Then I verify that duplicate validation messages are shown for the fields that have duplicate data
      await assertDuplicateValidationMessages(
        page,
        CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
        fillData,
      );

      // And I should remain on the create opportunity page
      await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);

      // And "Save and continue" button should be disabled, "Cancel" button should remain enabled
      await assertButtonEnabledDisabledStates(page, {
        "Save and continue": false,
        Cancel: true,
      });

      // When I reset to a fresh create form via UI.
      await openFreshCreateOpportunityForm(page);

      // Then I verify required-field gating of Save and continue.
      await fillRequiredFieldsAndAssertButtonState(
        page,
        CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
        fillData,
        {
          triggerButtonName: "Save and continue",
          additionalButtonStates: {
            Cancel: true,
          },
        },
      );

      // When I reset to a fresh create form via UI.
      await openFreshCreateOpportunityForm(page);

      // Then I verify that over-limit values are handled correctly.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
          buildOverLimitFillData(
            CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
            fillData,
          ),
        ),
      );

      // When I click "Save and continue" button
      await page.getByRole("button", { name: "Save and continue" }).click();

      // And I remain on the create opportunity page
      await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);

      // Then I verify that character limit validation messages still show up for all fields that have character limits
      await assertCharacterLimitMessageCount(
        page,
        CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
        getCharacterLimitedFields(
          CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
        ).length,
      );

      // And "Save and continue" button should be enabled, "Cancel" button should remain enabled
      await assertButtonEnabledDisabledStates(page, {
        "Save and continue": true,
        Cancel: true,
      });
    },
  );
});
