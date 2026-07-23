/**
 * @feature Organization detail page access
 * @featureFile e2e/organizations/features/organization-detail-access.feature
 * @scenario Org member can view their organization's detail page
 *
 * POC for multi-user auth: authenticates as the secondary org-member test user
 * and confirms per-user auth works by viewing that user's organization detail
 * page. The primary test user is not a member of this organization, so a
 * successful render proves the spoof logged in as the requested user.
 *
 * Note on expected auth behavior: the org detail page's AuthorizationGate
 * declares a manage_org_members requirement, but only renders its
 * onUnauthorized branch when a *resource fetch* returns 403 — not when the
 * privilege check does. An org member can fetch org details (VIEW_ORG_MEMBERSHIP),
 * so the page renders even though their manage_org_members check returns 403.
 * The unauthorized branch is instead reached by a non-member (see the feature's
 * TODO). Verified: this spec passes on Chrome, Firefox, and Mobile Chrome.
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { TEST_ORG_IDS } from "tests/e2e/utils/auth/test-users";

const { AUTH, CORE_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

// The org-member test user belongs to this organization in both local and
// staging seeds; the org shares the same legal business name in each.
const ORG_NAME = "E2E Test Organization";

test.describe("Organization detail page access", () => {
  // Run staging on Chrome only, mirroring the other staging auth specs;
  // cross-browser staging spoofing hasn't been validated yet.
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging auth specs run on Chrome only",
      );
    }
  });

  /**
   * @scenario Org member can view their organization's detail page
   */
  test(
    "Org member can view their organization's detail page",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given the user is logged in as the org-member test user
      await authenticateE2eUser(page, context, isMobile, "orgMember");

      // When the user navigates to their organization's detail page
      await page.goto(`/workspace/organizations/${TEST_ORG_IDS.e2eTestOrg}`, {
        waitUntil: "domcontentloaded",
      });

      // Then the organization name is shown as the page heading
      await expect(
        page.getByRole("heading", { level: 1, name: ORG_NAME }),
      ).toBeVisible();

      // And the organization roster section is visible
      await expect(
        page.getByRole("heading", { name: "Organization roster" }),
      ).toBeVisible();

      // And no unauthorized message is shown
      await expect(
        page.getByRole("heading", { name: "Unauthorized" }),
      ).toHaveCount(0);
    },
  );
});
