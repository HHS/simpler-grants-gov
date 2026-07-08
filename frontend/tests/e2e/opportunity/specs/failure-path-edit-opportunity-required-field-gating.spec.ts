/**
 * @feature Opportunity - failure path edit opportunity
 * @featureFile e2e/opportunity/features/failure-path-edit-opportunity.feature
 * @scenario Validate required-field gating and publish enablement on edit opportunity
 *
 * Scope in this spec:
 * - Seed a baseline opportunity and open edit flow.
 * - Validate required-field gating behavior for Publish.
 *
 * Reviewer guide (what happens in this test):
 * 1. Open edit mode from a freshly created opportunity.
 * 2. Confirm baseline button states before required fields are primed.
 * 3. Trigger Save once to verify page stays on edit route.
 * 4. Fill required fields from metadata and verify Publish gating behavior.
 *
 * Tester parameter guide:
 * - Update REQUIRED_FIELD_DEFINITIONS when required-field metadata changes.
 * - Update GATING_TRIGGER_BUTTON_NAME when trigger action changes.
 * - Update baseline values in opportunity-pages-fill-data.ts.
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
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  assertButtonEnabledDisabledStates,
  fillRequiredFieldsAndAssertButtonState,
} from "tests/e2e/utils/common/index";
import {
  EDIT_OPPORTUNITY_URL_PATTERN,
  openEditOpportunityFromCreate,
} from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const REQUIRED_FIELD_DEFINITIONS = [
  ...FUNDING_DETAILS_FIELD_DEFINITIONS,
  ...ELIGIBILITY_FIELD_DEFINITIONS,
];
const GATING_TRIGGER_BUTTON_NAME = "Publish";

test.describe("Opportunity failure path - edit opportunity", () => {
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
    "edit opportunity failure path - required field gating",
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
      // Given I create a new opportunity and open the edit page.
      // If navigation or default field values change, update shared util input
      // via fillData and update create-flow metadata in fixtures.
      await openEditOpportunityFromCreate(page, fillData);

      // And "Save" should be enabled while "Publish" and "Preview" remain disabled.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: false,
        Preview: false,
      });

      // When I click on "Save" button
      await page.getByRole("button", { name: "Save" }).click();

      // Then I verify that I remain on the edit opportunity page
      await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);

      // Then I verify required-field gating of Publish.
      // If required-field logic changes, update the metadata definitions in
      // opportunity-pages-field-definitions.ts and keep this input list aligned.
      await fillRequiredFieldsAndAssertButtonState(
        page,
        REQUIRED_FIELD_DEFINITIONS,
        fillData,
        {
          triggerButtonName: GATING_TRIGGER_BUTTON_NAME,
          additionalButtonStates: {
            Save: true,
            Preview: false,
          },
        },
      );

      // Out of scope in this file: character limits, date relationships, special characters,
      // and email display behavior are covered in dedicated failure-path specs.

      //----------Test steps end-----------------
    },
  );
});
