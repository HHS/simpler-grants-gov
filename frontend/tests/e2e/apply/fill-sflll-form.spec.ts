import { expect, test } from "@playwright/test";
import { FORMS_TEST_DATA } from "tests/e2e/apply/fixtures/test-data-for-sflll-forms.fixture";
import {
  getSflllFillFields,
  SFLLL_FORM_CONFIG,
} from "tests/e2e/apply/page-objects/sflll-form.page";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import {
  clearPageState,
  ensurePageClosed,
} from "tests/e2e/utils/lifecycle-helpers";

const { baseUrl, testOrgLabel, opportunityId } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${opportunityId}`;

test.describe("fill SF-LLL Form", () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    await authenticateE2eUser(page, context, !!isMobile);
  });

  test.setTimeout(120000);

  test("should fill SFLLL form", async ({ page, context }, testInfo) => {
    try {
      await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
        waitUntil: "load",
        timeout: 30000,
      });

      await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

      const sflllData = FORMS_TEST_DATA.sflll;

      await fillForm(testInfo, page, {
        formName: SFLLL_FORM_CONFIG.formName,
        fields: getSflllFillFields(sflllData),
        saveButtonTestId: SFLLL_FORM_CONFIG.saveButtonTestId,
        returnToApplication: false,
      });

      await expect(page.getByText(SFLLL_FORM_CONFIG.noErrorsText)).toBeVisible({
        timeout: 15000,
      });
    } finally {
      await clearPageState(context);
      await ensurePageClosed(page);
    }
  });
});
