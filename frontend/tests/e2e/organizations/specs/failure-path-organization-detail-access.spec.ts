/**
 * @feature Organization detail page access - failure path
 * @featureFile e2e/organizations/features/failure-path-organization-detail-access.feature
 * @scenario Failure path organization detail page access
 *
 * Dedicated failure-path tests for HHS/simpler-grants-gov#11814.
 * The org admin from another organization path exercises the org detail fetch 403 path
 * and the Unauthorized message. The signed-out path verifies the not-signed-in message
 * and the sign-in call to action.
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { getTestOrgId } from "tests/e2e/utils/auth/test-users";

const { AUTH, CORE_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

const ORG_NAME = "E2E Test Organization";

test.describe("Organization detail page access - failure path", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv !== "local") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging auth specs run on Chrome only",
      );
    }
  });

  /**
   * @scenario Org admin from another organization cannot access the organization detail page
   */
  test(
    "Org admin from another organization cannot access the organization detail page",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given the user is logged in as an org admin for a different organization
      await authenticateE2eUser(page, context, isMobile, "primaryOrgAdmin");

      // When the user navigates to another organization's detail page
      // This exercises the organization detail fetch 403 path and should show the
      // Unauthorized message.
      await page.goto(
        `/workspace/organizations/${getTestOrgId("e2eTestOrg")}`,
        { waitUntil: "domcontentloaded" },
      );

      // Then the unauthorized message is shown
      await expect(
        page.getByRole("heading", { name: "Unauthorized" }),
      ).toBeVisible();

      // And the organization detail content is not visible
      await expect(
        page.getByRole("heading", { level: 1, name: ORG_NAME }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Organization roster" }),
      ).toHaveCount(0);
    },
  );

  /**
   * @scenario Org admin from another organization still cannot access the organization detail page after reload
   */
  test(
    "Org admin from another organization still cannot access the organization detail page after reload",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given the user is logged in as an org admin for a different organization
      await authenticateE2eUser(page, context, isMobile, "primaryOrgAdmin");

      // When the user navigates to another organization's detail page
      await page.goto(
        `/workspace/organizations/${getTestOrgId("e2eTestOrg")}`,
        { waitUntil: "domcontentloaded" },
      );

      // And the user refreshes the page
      await page.reload({ waitUntil: "domcontentloaded" });

      // Then the unauthorized message is still shown
      await expect(
        page.getByRole("heading", { name: "Unauthorized" }),
      ).toBeVisible();

      // And the organization detail content is still not visible
      await expect(
        page.getByRole("heading", { level: 1, name: ORG_NAME }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Organization roster" }),
      ).toHaveCount(0);
    },
  );

  /**
   * @scenario Signed-out user cannot access an organization's detail page
   */
  test(
    "Signed-out user cannot access an organization's detail page",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given the user is signed out
      // Default test context starts signed out. This scenario does not call
      // authenticateE2eUser(), so no authenticated session is present.

      // When the user navigates directly to an organization's detail page
      await page.goto(
        `/workspace/organizations/${getTestOrgId("e2eTestOrg")}`,
        { waitUntil: "domcontentloaded" },
      );

      // Then the unauthenticated message is shown
      await expect(
        page.getByRole("heading", { name: "Not signed in" }),
      ).toBeVisible();

      // And the sign-in CTA is shown
      await expect(
        page.getByText("Sign in first in order to view this page"),
      ).toBeVisible();
    },
  );
});
