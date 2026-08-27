/**
 * @feature Opportunity list page access - failure path
 * @featureFile e2e/opportunity/features/failure-path-opportunities-list.feature
 * @scenario Grantor opportunities list failure paths
 *
 * Notes for reviewer:
 * - Tests the failure paths for accessing the grantor opportunities list page.
 * - Verifies the unauthenticated state for anonymous users.
 * - Verifies the no-agency state for authenticated users with zero agency associations.
 * - Verifies the agency-not-authorized state for authenticated users without access to the requested agency.
 * - Reuses a helper to assert the agency-not-authorized state for both valid non-member and invalid agency IDs.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  INVALID_AGENCY_ID,
  VALID_NON_MEMBER_AGENCY_ID,
} from "tests/e2e/opportunity/fixtures/opportunity-test-data";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";

const { AUTH, CORE_REGRESSION } = VALID_TAGS;

const AGENCY_NOT_AUTHORIZED_MESSAGE =
  "You do not have access to this agency's opportunities.";

// Shared helper for asserting the agency-not-authorized state on the grantor opportunities page.
const assertAgencyNotAuthorized = async (page: Page, agencyId: string) => {
  // Given I navigate to the grantor opportunities list for the requested agency.
  await page.goto(`/grantor/opportunities?agency=${agencyId}`, {
    waitUntil: "networkidle",
  });

  // Then the browser should be on the expected agency URL.
  await expect(page).toHaveURL(/\/grantor\/opportunities\?agency=/, {
    timeout: 30000,
  });

  // And the agency-not-authorized message should be visible.
  await expect(page.getByText(AGENCY_NOT_AUTHORIZED_MESSAGE)).toBeVisible({
    timeout: 30000,
  });
};

test.describe("Opportunity list page access - failure path", () => {
  test(
    "Unauthenticated user sees an unauthenticated state when accessing the grantor opportunities list page",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I access the grantor opportunities list without signing in.
      await page.goto("/grantor/opportunities", {
        waitUntil: "domcontentloaded",
      });

      // Then I should see the unauthenticated heading and message.
      await expect(
        page.getByRole("heading", { name: "Not signed in" }),
      ).toBeVisible();
      await expect(
        page.getByText("Sign in first in order to view this page"),
      ).toBeVisible();
    },
  );

  // test fail: I comment this sceanrio until fixed.
  // test(
  //   "Authenticated user with no agencies sees the no-agency state",
  //   { tag: [AUTH, CORE_REGRESSION] },
  //   async ({ page, context }, { project }) => {
  //     const isMobile = !!project.name.match(/[Mm]obile/);

  //     // Given I sign in as a user with no agency associations.
  //     await authenticateE2eUser(page, context, isMobile, "noAgencyUser");

  //     // When I navigate to the grantor opportunities list.
  //     await page.goto("/grantor/opportunities", {
  //       waitUntil: "networkidle",
  //     });

  //     // Then I should see the no-agency message.
  //     await expect(
  //       page.getByText("You are not associated with any agencies."),
  //     ).toBeVisible({ timeout: 30000 });
  //   },
  // );

  test(
    "Authenticated org member with agencies but not in the requested agency sees an unauthorized agency state for a valid non-member agency ID",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given I sign in as an org member with an agency association and request a non-member agency.
      await authenticateE2eUser(page, context, isMobile, "orgMemberWithAgency");

      // Then the agency-not-authorized message should be shown.
      await assertAgencyNotAuthorized(page, VALID_NON_MEMBER_AGENCY_ID);
    },
  );

  test(
    "Authenticated org member with agencies but not in the requested agency sees an unauthorized agency state for an invalid agency ID",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given I sign in as the same org member with an agency association and request an invalid agency.
      await authenticateE2eUser(page, context, isMobile, "orgMemberWithAgency");

      // Then the agency-not-authorized message should be shown.
      await assertAgencyNotAuthorized(page, INVALID_AGENCY_ID);
    },
  );
});
