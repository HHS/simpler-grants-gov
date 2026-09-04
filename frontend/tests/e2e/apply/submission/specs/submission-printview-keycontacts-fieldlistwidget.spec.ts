import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  buildKeyContactsOptionalFieldsHappyPathTestData,
  buildKeyContactsRequiredFieldsHappyPathTestData,
} from "tests/e2e/apply/fixtures/key-contacts-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  skipNonChromeOnStaging,
  skipWebkit,
} from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { fillFormPartial } from "tests/e2e/utils/forms/general-forms-filling";
import { clickSaveButton } from "tests/e2e/utils/forms/save-form-utils";
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import type { FilledFormEntry } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  buildPrintUrl,
  navigateToPrintView,
  validateAllPrintViews,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, FULL_REGRESSION, GRANTEE } =
  VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_NUMBER = "E2E-KC-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName: "Key Contacts - FieldList complete workflow - Organization user",
    orgLabel: testOrgLabel,
  },
  {
    testName: "Key Contacts - FieldList complete workflow - Individual user",
    orgLabel: undefined,
  },
] as const;

test.describe("Key Contacts FieldList", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    skipNonChromeOnStaging(testInfo);
    skipWebkit(testInfo);
  });

  for (const { testName, orgLabel } of applicantScenarios) {
    test(
      testName,
      {
        tag: [FULL_REGRESSION, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION],
      },
      async (
        { page, context }: { page: Page; context: BrowserContext },
        testInfo: TestInfo,
      ) => {
        test.setTimeout(300_000);
        const isMobile = testInfo.project.name.match(/[Mm]obile/);

        await authenticateE2eUser(page, context, !!isMobile);
        await createApplication(
          page,
          opportunityConfig.opportunityUrl,
          orgLabel,
        );
        const applicationUrl = page.url();
        const keyContactsForm = opportunityConfig.forms.find(
          ({ formKey }) => formKey === "keyContacts",
        );
        if (!keyContactsForm) {
          throw new Error("Key Contacts form configuration was not found");
        }
        /*
         * Build two complete FieldList entries using the same required +
         * optional test-data builders used by the existing Key Contacts tests.
         *
         * The index is important because FieldList fields are represented as:
         * key_contacts[0]--...
         * key_contacts[1]--...
         */
        const suffix = Date.now();
        const firstEntry = {
          ...buildKeyContactsRequiredFieldsHappyPathTestData(suffix, 0),
          ...buildKeyContactsOptionalFieldsHappyPathTestData(suffix, 0),
        };
        const secondEntry = {
          ...buildKeyContactsRequiredFieldsHappyPathTestData(suffix + 1, 1),
          ...buildKeyContactsOptionalFieldsHappyPathTestData(suffix + 1, 1),
        };
        const applicantOrganizationName = `FieldList Organization ${suffix}`;

        /*
         * Navigate to the Key Contacts form using openForm.
         */
        const formMatcher = /key contacts/i;
        const opened = await openForm(page, formMatcher);
        if (!opened) {
          throw new Error("Could not open Key Contacts form");
        }

        /*
         * Wait for the form to be ready, then fill the first entry.
         */
        await page
          .getByText(formMatcher)
          .first()
          .waitFor({ state: "visible", timeout: 35000 });
        await page
          .locator("form, fieldset")
          .first()
          .waitFor({ state: "attached", timeout: 15000 });

        const initialTestData = {
          applicant_organization_name: applicantOrganizationName,
          ...firstEntry,
        };

        await fillFormPartial(
          testInfo,
          page,
          keyContactsForm.formConfig.fields,
          initialTestData,
        );

        /*
         * Now add a second Key Contact entry via the add button.
         */
        await page.getByRole("button", { name: /add.*key contact/i }).click();
        await expect(
          page.getByTestId("key_contacts[1]--project_role"),
        ).toBeVisible();

        /*
         * Fill the second FieldList entry using fillFormPartial.
         */
        await fillFormPartial(
          testInfo,
          page,
          keyContactsForm.formConfig.fields,
          secondEntry,
        );

        /*
         * Save the form.
         */
        await clickSaveButton(
          page,
          keyContactsForm.formConfig.saveButtonTestId,
        );

        /*
         * Verify the form is complete after saving.
         */
        await expect(page.getByText(/complete/i).first()).toBeVisible();

        /*
         * Navigate away from the form and return to verify that both
         * FieldList entries persisted.
         */
        await page.goto(applicationUrl);
        await page.waitForLoadState("domcontentloaded");

        /*
         * Re-open the form to verify persistence.
         */
        const reopened = await openForm(page, formMatcher);
        if (!reopened) {
          throw new Error("Could not re-open Key Contacts form");
        }

        await page
          .getByText(formMatcher)
          .first()
          .waitFor({ state: "visible", timeout: 35000 });
        await page
          .locator("form, fieldset")
          .first()
          .waitFor({ state: "attached", timeout: 15000 });

        await expect(
          page.getByTestId("key_contacts[1]--project_role"),
        ).toBeVisible();
        /*
         * Verify values from the first FieldList entry persisted.
         */
        for (const [fieldId, value] of Object.entries(firstEntry)) {
          const stringValue = String(value);
          await expect(page.getByTestId(fieldId)).toHaveValue(stringValue);
        }
        /*
         * Verify values from the second FieldList entry persisted.
         */
        for (const [fieldId, value] of Object.entries(secondEntry)) {
          const stringValue = String(value);
          await expect(page.getByTestId(fieldId)).toHaveValue(stringValue);
        }
        /*
         * Capture the print-view URL before leaving the form.
         */
        const printUrl = buildPrintUrl(page.url());
        /*
         * Return to the application and submit.
         */
        await page.goto(applicationUrl);
        await page.waitForLoadState("domcontentloaded");
        await submitApplicationAndVerify(page, "success");
        await verifySubmissionConfirmation(page);
        /*
         * Open the print view and verify the FieldList data rendered.
         */
        await navigateToPrintView(page, printUrl);

        /*
         * Build a FilledFormEntry for validateAllPrintViews validation.
         * Combine both FieldList entries along with the organization name.
         */
        const testData = {
          ...firstEntry,
          ...secondEntry,
          applicant_organization_name: applicantOrganizationName,
        };

        const filledForms: FilledFormEntry[] = [
          {
            formKey: keyContactsForm.formKey,
            formName: keyContactsForm.formConfig.formName,
            testData,
            printUrl,
            expectedPrepopulatedFields:
              keyContactsForm.expectedPrepopulatedFields,
            userEnteredFieldTestIds: keyContactsForm.userEnteredFieldTestIds,
            expectedSectionHeading: keyContactsForm.formConfig.formName,
          },
        ];

        /*
         * Keep the existing print-view validation as a broad regression check.
         */
        await validateAllPrintViews(page, filledForms);
        /*
         * Explicitly verify values from both FieldList entries.
         *
         * This is intentionally separate from validateAllPrintViews() because
         * the acceptance criteria require the print-view values to match the
         * values entered in the application.
         */
        for (const [, value] of Object.entries(firstEntry)) {
          await expect(
            page.getByText(value, { exact: true }).first(),
          ).toBeVisible();
        }
        for (const [, value] of Object.entries(secondEntry)) {
          await expect(
            page.getByText(value, { exact: true }).first(),
          ).toBeVisible();
        }
        await expect(
          page.getByText(applicantOrganizationName, { exact: true }),
        ).toBeVisible();
      },
    );
  }
});
