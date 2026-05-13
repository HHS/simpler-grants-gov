/**
 * @feature Apply - Field Boundary Validation
 * @description
 *   Demonstrates the reusable field-validation utility framework by running
 *   boundary-condition checks against all configured SF-424 form fields.
 *
 *   The test navigates to the SF-424 form, then delegates all field validation
 *   to `validateFieldConstraints`, which iterates through the field config and
 *   checks min/max length, numeric ranges, required rules, and patterns.
 *
 *   This spec is intentionally environment-agnostic — it runs locally and in
 *   staging, skipping only non-Chrome browsers in staging (MFA rate-limiting).
 *
 * Usage:
 *   npx playwright test field-boundary-validation
 */

import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { validateFieldConstraints } from "tests/e2e/utils/field-validation";
import { SF424_FORM_MATCHER } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import { SF424_VALIDATION_CONFIG } from "tests/e2e/utils/field-validation/configs/sf424-validation-config";

const { APPLY, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${getOpportunityId()}`;

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test(
  "SF-424 form field boundary validation",
  { tag: [APPLY, FULL_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(600_000); // 10 min — boundary checks iterate many fields

    const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

    // ── Setup: authenticate and navigate to form ────────────────────────────
    await authenticateE2eUser(page, context, isMobile);
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await openForm(page, SF424_FORM_MATCHER);

    // ── Run field boundary validation ───────────────────────────────────────
    const report = await validateFieldConstraints(
      page,
      SF424_VALIDATION_CONFIG,
      testInfo,
    );

    // ── Assert: no validation checks failed ─────────────────────────────────
    expect(
      report.failed,
      `${report.failed} of ${report.totalChecks} field validation checks failed. ` +
        "See the attached field-validation-report.txt for details.",
    ).toBe(0);
  },
);
