/**
 * @feature Opportunity list page access - failure path
 * @featureFile e2e/opportunity/features/failure-path-opportunities-list.feature
 * @scenario Unauthenticated access to the Grantor opportunities list page.
 *
 * Notes for reviewer:
 * 1) Navigates to /grantor/opportunities without authentication.
 * 2) Verifies the unauthenticated error state is displayed.
 * 3) Verifies the sign-in CTA text is visible.
 */

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  VALID_NON_MEMBER_AGENCY_ID,
  INVALID_AGENCY_ID,
} from "tests/e2e/opportunity/fixtures/opportunity-test-data";

const { AUTH, CORE_REGRESSION } = VALID_TAGS;

const AGENCY_NOT_AUTHORIZED_MESSAGE =
  "You do not have access to this agency's opportunities.";

test.describe("Opportunity list page access - failure path", () => {
  test(
    "Unauthenticated user sees the unauthenticated state when accessing the opportunities list page",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      // Direct unauthenticated access to the grantor opportunities list.
      await page.goto("/grantor/opportunities", {
        waitUntil: "domcontentloaded",
      });

      await expect(
        page.getByRole("heading", { name: "Not signed in" }),
      ).toBeVisible();
      await expect(
        page.getByText("Sign in first in order to view this page"),
      ).toBeVisible();
    },
  );

  test(
    "Authenticated user without agency access sees an agency not authorized state for a valid agency they do not belong to",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Authenticate as an org-member user who should not have grantor access for the test agency.
      await authenticateE2eUser(page, context, isMobile, "orgMember");

      // Use a valid agency id that the user is not permitted to view.
      await page.goto(
        `/grantor/opportunities?agency=${VALID_NON_MEMBER_AGENCY_ID}`,
        { waitUntil: "domcontentloaded" },
      );

      await expect(page.getByText(AGENCY_NOT_AUTHORIZED_MESSAGE)).toBeVisible();
    },
  );

  test(
    "Authenticated user without agency access sees an agency not authorized state for an invalid agency ID",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Authenticate as the same org-member user, then request a bogus agency id.
      await authenticateE2eUser(page, context, isMobile, "orgMember");

      // This should exercise the invalid agency fallback in the opportunities page.
      await page.goto(`/grantor/opportunities?agency=${INVALID_AGENCY_ID}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.getByText(AGENCY_NOT_AUTHORIZED_MESSAGE)).toBeVisible();
    },
  );
});
