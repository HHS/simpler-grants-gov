import { test } from "@playwright/test";
import { FORMS_TEST_DATA } from "tests/e2e/apply/fixtures/test-data-for-sflll-forms.fixture";
import {
  getSflllFillFields,
  SFLLL_FORM_CONFIG,
} from "tests/e2e/apply/page-objects/sflll-form.page";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillAnyForm } from "tests/e2e/utils/forms/general-forms-filling";
import {
  clearPageState,
  ensurePageClosed,
} from "tests/e2e/utils/lifecycle-helpers";

const { baseUrl, testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test.describe("fill SF-LLL Form", () => {
  test.beforeEach(async ({ context }) => {
    await createSpoofedSessionCookie(context);
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

      await fillAnyForm(testInfo, page, {
        formName: SFLLL_FORM_CONFIG.formName,
        fields: getSflllFillFields(sflllData),
        saveButtonTestId: SFLLL_FORM_CONFIG.saveButtonTestId,
        noErrorsText: SFLLL_FORM_CONFIG.noErrorsText,
      });
    } finally {
      await clearPageState(context);
      await ensurePageClosed(page);
    }
  });
});
