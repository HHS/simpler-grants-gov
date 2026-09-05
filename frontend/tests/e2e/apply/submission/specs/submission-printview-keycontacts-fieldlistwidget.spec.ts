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
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
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

        const getFieldLocator = (
          fieldId: string,
        ): ReturnType<typeof page.locator> => {
          const fieldDef = keyContactsForm.formConfig.fields[fieldId];
          if (fieldDef?.selector) {
            return page.locator(fieldDef.selector);
          }

          return page.getByTestId(fieldDef?.testId ?? fieldId);
        };

        const waitForFieldToRender = async (
          fieldId: string,
          timeout = 30000,
        ): Promise<ReturnType<typeof page.locator>> => {
          const fieldDef = keyContactsForm.formConfig.fields[fieldId];
          const selectorLocator = fieldDef?.selector
            ? page.locator(fieldDef.selector)
            : null;
          const testIdLocator = page.getByTestId(fieldDef?.testId ?? fieldId);
          const nameLocator = page.locator(`[name="${fieldId}"]`);

          const candidateLocators: Array<ReturnType<typeof page.locator>> = [
            selectorLocator,
            testIdLocator,
            nameLocator,
          ].filter(
            (locator): locator is ReturnType<typeof page.locator> =>
              locator !== null,
          );

          for (const locator of candidateLocators) {
            try {
              await locator.waitFor({ state: "attached", timeout });
              return locator;
            } catch {
              // Try the next locator strategy.
            }
          }

          throw new Error(
            `Field ${fieldId} did not render within ${timeout}ms`,
          );
        };
        /*
         * Build two FieldList entries. The first entry uses both required and
         * optional fields to demonstrate complete form filling. The second entry
         * uses only required fields to avoid excessive form re-rendering during
         * multi-field fills on the dynamically-added entry.
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
        };
        const applicantOrganizationName = `FieldList Organization ${suffix}`;

        /*
         * Extract only the FieldList entry fields (key_contacts[index]--*),
         * excluding the form-level applicant_organization_name.
         */
        const firstEntryFieldListData = Object.fromEntries(
          Object.entries(firstEntry).filter(
            ([key]) => key !== "applicant_organization_name",
          ),
        ) as Record<string, string>;

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

        /*
         * Wait for the form to be fully stable before filling.
         */
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 500)),
        );
        await page.waitForLoadState("networkidle");

        const initialTestData = {
          applicant_organization_name: applicantOrganizationName,
          ...firstEntryFieldListData,
        };

        await fillFormPartial(
          testInfo,
          page,
          keyContactsForm.formConfig.fields,
          initialTestData,
        );

        /*
         * Save the first entry. The "Add" button may only appear after
         * the first entry is saved on some form implementations.
         */
        await clickSaveButton(
          page,
          keyContactsForm.formConfig.saveButtonTestId,
        );

        /*
         * Wait for save to complete, then look for the "Add another entry" button.
         * This button is rendered by FieldListWidget to add additional entries.
         */
        await page.waitForLoadState("networkidle");

        const addButton = page.getByRole("button", {
          name: /add another entry/i,
        });
        await addButton.scrollIntoViewIfNeeded();
        await addButton.waitFor({ state: "visible", timeout: 30000 });
        await addButton.click();

        /*
         * After adding the entry, wait for the form to finish rendering all
         * new fields before attempting to fill them. The form may still be
         * updating (re-rendering, layout calculations, etc.) even after
         * networkidle, so we use multiple stability checks.
         */
        await page.waitForLoadState("networkidle");
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000)),
        );

        const secondEntryHeading = page.getByText("Key Contact 2", {
          exact: true,
        });
        await secondEntryHeading.waitFor({ state: "visible", timeout: 30000 });

        /*
         * The second entry may be in the DOM but not yet fully rendered by React.
         * Wait for multiple render cycles and then try multiple locator strategies.
         */
        let firstSecondEntryField: ReturnType<typeof page.locator> | null =
          null;
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await page.waitForLoadState("networkidle");
            await page.evaluate(
              () => new Promise((resolve) => setTimeout(resolve, 500)),
            );
            firstSecondEntryField = await waitForFieldToRender(
              "key_contacts[1]--project_role",
              10000,
            );
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));
            if (attempt === 2 && lastError) {
              throw lastError;
            }
          }
        }

        if (!firstSecondEntryField) {
          throw new Error(
            "Could not locate key_contacts[1]--project_role after 3 attempts",
          );
        }

        try {
          await firstSecondEntryField.scrollIntoViewIfNeeded({
            timeout: 10000,
          });
        } catch {
          await firstSecondEntryField.evaluate((element: Element) =>
            element.scrollIntoView({
              behavior: "instant",
              block: "center",
              inline: "center",
            }),
          );
        }

        await expect(firstSecondEntryField).toBeVisible({ timeout: 15000 });

        /*
         * Wait for the form to be fully stable before filling.
         * Add a small delay and another networkidle wait to catch any
         * remaining React state updates or layout calculations.
         */
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 500)),
        );
        await page.waitForLoadState("networkidle");

        /*
         * Extract only the FieldList entry fields (key_contacts[index]--*),
         * excluding the form-level applicant_organization_name.
         */
        const secondEntryFieldListData = Object.fromEntries(
          Object.entries(secondEntry).filter(
            ([key]) => key !== "applicant_organization_name",
          ),
        ) as Record<string, string>;

        /*
         * Fill the second dynamic entry through the same form metadata as the
         * first entry so selector-backed fields (like country/state) are handled
         * with the correct handlers instead of being treated as raw text inputs.
         */
        await fillFormPartial(
          testInfo,
          page,
          keyContactsForm.formConfig.fields,
          secondEntryFieldListData,
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
        await verifyFormStatusAfterSave(page, "complete");

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

        /*
         * Wait for the form to be fully stable before checking persistence.
         */
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 500)),
        );
        await page.waitForLoadState("networkidle");

        await expect(
          getFieldLocator("key_contacts[1]--project_role"),
        ).toBeVisible();
        /*
         * Verify values from the first FieldList entry persisted.
         * Skip applicant_organization_name as it's a form-level field, not a FieldList entry.
         */
        for (const [fieldId, value] of Object.entries(
          firstEntryFieldListData,
        )) {
          if (fieldId === "applicant_organization_name") {
            continue;
          }
          const stringValue = String(value);
          await expect(getFieldLocator(fieldId)).toHaveValue(stringValue);
        }
        /*
         * Verify values from the second FieldList entry persisted.
         * Skip applicant_organization_name as it's a form-level field, not a FieldList entry.
         */
        for (const [fieldId, value] of Object.entries(
          secondEntryFieldListData,
        )) {
          if (fieldId === "applicant_organization_name") {
            continue;
          }
          const stringValue = String(value);
          await expect(getFieldLocator(fieldId)).toHaveValue(stringValue);
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
