/**
 * Opportunity overview status helpers.
 * Scope: grantor opportunity overview page rows that pair a section link with a status label.
 * Usage: import { assertOverviewSectionStatus } from "tests/e2e/utils/opportunities/overview-status-utils";
 *
 * Notes for reviewer (what this utility does):
 * 1) Locates a single overview row by exact section link text.
 * 2) Verifies the expected status label is visible within that same row.
 * 3) Supports both single assertion mode and multi-section map assertion mode.
 *
 * Tester parameter guide:
 * - Single assertion mode:
 *   assertOverviewSectionStatus(page, "Opportunity Summary", "Complete")
 * - Multi assertion mode:
 *   assertOverviewSectionStatus(page, {
 *     "Opportunity Summary": "Complete",
 *     "Application Package": "Not started",
 *   })
 * - Matching is exact for section name and status text.
 */

import { expect, type Page } from "@playwright/test";

type OverviewSectionStatusMap = Record<string, string>;

const assertSingleOverviewSectionStatus = async (
  page: Page,
  sectionName: string,
  expectedStatus: string,
): Promise<void> => {
  const overviewRow = page.locator("div.grid-row", {
    has: page.getByRole("link", { name: sectionName, exact: true }),
  });

  await expect(
    overviewRow.getByText(expectedStatus, { exact: true }),
  ).toBeVisible();
};

/** Asserts that a specific overview section row shows the expected status label. */
export const assertOverviewSectionStatus = async (
  page: Page,
  sectionNameOrStatuses: string | OverviewSectionStatusMap,
  expectedStatus?: string,
): Promise<void> => {
  if (typeof sectionNameOrStatuses === "string") {
    if (!expectedStatus) {
      throw new Error(
        "Expected status is required when asserting a single overview section",
      );
    }

    await assertSingleOverviewSectionStatus(
      page,
      sectionNameOrStatuses,
      expectedStatus,
    );
    return;
  }

  for (const [sectionName, status] of Object.entries(sectionNameOrStatuses)) {
    await assertSingleOverviewSectionStatus(page, sectionName, status);
  }
};
