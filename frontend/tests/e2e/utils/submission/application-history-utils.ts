import { expect, type Page } from "@playwright/test";

/**
 * Asserts that the Application History section and its table headers are
 * rendered and visible on the current page. Assumes navigation to the
 * application (or a page containing the history table) has already occurred.
 *
 * @param page Playwright Page object
 */
export async function assertApplicationHistoryVisible(
  page: Page,
): Promise<void> {
  await expect(
    page.getByRole("heading", { name: "Application History" }),
  ).toBeVisible();
  await expect(page.locator("#main-content")).toContainText(
    "Application History",
  );

  // Wait for table to be visible (may take longer on mobile)
  // Look for either a standard table or a responsive data table container
  const tableContainer = page
    .locator("table, [role='table'], [data-testid*='responsive-data']")
    .first();
  await expect(tableContainer).toBeVisible({ timeout: 10000 });
}

/**
 * Reads every "Activity" value currently rendered in the Application History
 * table, in display order (index 0 = most recent), by walking the
 * `responsive-data-{row}-1` test IDs until one is no longer visible.
 *
 * Prefer this when a test needs flexible or partial assertions - e.g.
 * confirming a specific entry is/isn't present, or that a subset of entries
 * exists (`expect(activities).toEqual(expect.arrayContaining([...]))`).
 *
 * For asserting a complete, exact, ordered set of entries (e.g. right after
 * a full submission), use `verifyPostSubmission` in post-submission-utils.ts
 * instead, which also asserts there are no unexpected extra rows.
 *
 * @param page Playwright Page object
 */
export async function getApplicationHistoryActivities(
  page: Page,
): Promise<string[]> {
  await assertApplicationHistoryVisible(page);

  const activities: string[] = [];
  let row = 0;
  while (
    await page
      .getByTestId(`responsive-data-${row}-1`)
      .isVisible()
      .catch(() => false)
  ) {
    activities.push(
      (await page.getByTestId(`responsive-data-${row}-1`).textContent()) ?? "",
    );
    row++;
  }
  return activities;
}
