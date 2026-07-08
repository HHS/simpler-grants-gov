/**
 * @feature Opportunity - failure path edit opportunity
 * @featureFile e2e/opportunity/features/failure-path-edit-opportunity.feature
 * @scenario Validate email format checks on edit opportunity
 *
 * Reviewer guide (what happens in this test):
 * 1. Seed a valid opportunity and open edit flow.
 * 2. Prime required fields so publish-path checks stay reachable.
 * 3. Enter invalid contact email and verify format error on Save.
 * 4. Verify the same format error persists on Publish.
 *
 * Tester parameter guide:
 * - Update INVALID_CONTACT_EMAIL to change negative test input.
 * - Update CONTACT_EMAIL_VALUE_KEY if metadata key changes.
 * - Update ADDITIONAL_INFORMATION_FIELD_DEFINITIONS metadata/messages.
 * - Update baseline values in opportunity-pages-fill-data.ts.
 *
 */

import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
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
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import {
  EDIT_OPPORTUNITY_URL_PATTERN,
  primeEditOpportunityForPublishChecks,
} from "tests/e2e/utils/opportunity/edit-opportunity-setup-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const INVALID_CONTACT_EMAIL = "abc";
const CONTACT_EMAIL_VALUE_KEY = "contactEmail";
const CONTACT_EMAIL_ERROR_SELECTOR = "#error-for-contactEmail";

test.describe("Opportunity failure path - edit opportunity email format", () => {
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
    "edit opportunity failure path - email format validation",
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

      // When I enter an invalid email and click Save.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(ADDITIONAL_INFORMATION_FIELD_DEFINITIONS, {
          ...fillData,
          contactEmail: INVALID_CONTACT_EMAIL,
        }),
      );
      await page.getByRole("button", { name: "Save" }).click();

      // Then I remain on edit page and see contact-email format validation.
      await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Preview: false,
        Publish: true,
      });

      const contactEmailField = ADDITIONAL_INFORMATION_FIELD_DEFINITIONS.find(
        (field) => field.valueKey === CONTACT_EMAIL_VALUE_KEY,
      );
      expect(contactEmailField?.emailValidationMessage).toBeDefined();
      await expect(page.locator(CONTACT_EMAIL_ERROR_SELECTOR)).toHaveText(
        String(contactEmailField?.emailValidationMessage),
      );

      // And I verify contact-email format validation message still remains.
      await page.getByRole("button", { name: "Publish" }).click();
      await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);
      await expect(page.locator(CONTACT_EMAIL_ERROR_SELECTOR)).toHaveText(
        String(contactEmailField?.emailValidationMessage),
      );

      //----------Test steps end-----------------
    },
  );
});
