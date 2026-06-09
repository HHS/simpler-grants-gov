// table-row-utils.ts
// Waits for and interacts with table rows by title and status in list views.
// Usage: import { waitForTableRow, waitForOpportunityRowByStatus, clickRowTitle } from "tests/e2e/utils/common/table-row-utils";

import { expect, type Locator, type Page } from "@playwright/test";

type WaitForTableRowOptions = {
  linkText: string;
  statusText: RegExp;
  rowSelector?: string;
  timeoutMs?: number;
  intervalsMs?: number[];
  message?: string;
};

type WaitForOpportunityRowByStatusOptions = {
  title: string;
  status: string;
  rowSelector?: string;
  timeoutMs?: number;
  intervalsMs?: number[];
  message?: string;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeOpportunityStatusPattern = (status: string): RegExp => {
  const trimmed = status.trim();

  // UI status text is "posted" while product language often says "published".
  if (/^(published|posted)$/i.test(trimmed)) {
    return /\b(published|posted)\b/i;
  }

  return new RegExp(`\\b${escapeRegex(trimmed)}\\b`, "i");
};

const getMatchingRowLocator = (
  page: Page,
  rowSelector: string,
  linkText: string,
  statusText: RegExp,
): Locator => {
  const rowsByTitle = page.locator(rowSelector).filter({
    has: page.getByRole("link", {
      name: linkText,
      exact: true,
    }),
  });

  const rowsByStatusCell = rowsByTitle.filter({
    has: page
      .locator('td [data-testid^="responsive-data-"][data-testid$="-2"]')
      .filter({ hasText: statusText }),
  });

  return rowsByStatusCell.or(rowsByTitle.filter({ hasText: statusText }));
};

const isLikelyLoggedOut = async (page: Page): Promise<boolean> => {
  if (/\/(sign-in|login|auth)(?:\/|$|\?)/i.test(page.url())) {
    return true;
  }

  const opportunitiesHeading = page
    .getByRole("heading", { name: /opportunities list/i })
    .first();
  const accountButton = page.getByRole("button", { name: /account/i }).first();
  const signInLink = page.getByRole("link", { name: /sign in/i }).first();
  const signInHeading = page
    .getByRole("heading", { name: /sign in to your account/i })
    .first();

  const [
    hasOpportunitiesHeading,
    hasAccountButton,
    hasSignInLink,
    hasSignInHeading,
  ] = await Promise.all([
    opportunitiesHeading.isVisible().catch(() => false),
    accountButton.isVisible().catch(() => false),
    signInLink.isVisible().catch(() => false),
    signInHeading.isVisible().catch(() => false),
  ]);

  if (hasOpportunitiesHeading) {
    return false;
  }

  return !hasAccountButton && (hasSignInLink || hasSignInHeading);
};

export const waitForTableRow = async (
  page: Page,
  options: WaitForTableRowOptions,
): Promise<Locator> => {
  const {
    linkText,
    statusText,
    rowSelector = "tbody tr",
    timeoutMs = 90000,
    intervalsMs = [1000, 2000, 5000],
    message = "Waiting for matching table row to appear",
  } = options;

  let pollAttempt = 0;
  let logoutSignalCount = 0;

  await expect
    .poll(
      async () => {
        pollAttempt += 1;

        if (await isLikelyLoggedOut(page)) {
          logoutSignalCount += 1;
          if (logoutSignalCount >= 2) {
            throw new Error(
              "Authentication appears to be lost while waiting for table row",
            );
          }
        } else {
          logoutSignalCount = 0;
        }

        const rowCount = await getMatchingRowLocator(
          page,
          rowSelector,
          linkText,
          statusText,
        ).count();

        if (rowCount > 0) {
          return rowCount;
        }

        // Reload occasionally to pick up delayed backend updates without
        // constantly resetting page state on every poll iteration.
        if (pollAttempt % 3 === 0) {
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForLoadState("load").catch(() => undefined);
          await expect(
            page.getByRole("heading", { name: /opportunities list/i }).first(),
          )
            .toBeVisible({ timeout: 10000 })
            .catch(() => undefined);

          if (await isLikelyLoggedOut(page)) {
            logoutSignalCount += 1;
            if (logoutSignalCount >= 2) {
              throw new Error(
                "Authentication appears to be lost after reloading while waiting for table row",
              );
            }
          } else {
            logoutSignalCount = 0;
          }
        }

        return getMatchingRowLocator(
          page,
          rowSelector,
          linkText,
          statusText,
        ).count();
      },
      {
        message,
        timeout: timeoutMs,
        intervals: intervalsMs,
      },
    )
    .toBeGreaterThan(0);

  return getMatchingRowLocator(page, rowSelector, linkText, statusText).first();
};

export const clickRowTitle = async (
  row: Locator,
  title: string,
): Promise<void> => {
  const titleLink = row.getByRole("link", {
    name: title,
    exact: true,
  });

  if (await titleLink.count()) {
    await titleLink.first().click();
    return;
  }

  await row.getByText(title, { exact: true }).first().click();
};

export const waitForOpportunityRowByStatus = async (
  page: Page,
  options: WaitForOpportunityRowByStatusOptions,
): Promise<Locator> => {
  const {
    title,
    status,
    rowSelector = "tbody tr",
    timeoutMs = 180000, // allow backend indexing/propagation
    message = `Waiting for ${status} opportunity row to appear on list`,
  } = options;

  const statusPattern = normalizeOpportunityStatusPattern(status);

  const row = page.locator(rowSelector).filter({
    has: page.getByRole("link", { name: title, exact: true }),
  }).first();

  await expect(row, `${message} (row not found by title)`).toBeVisible({
    timeout: timeoutMs,
  });

  const statusCell = row.locator('td [data-testid^="responsive-data-"][data-testid$="-2"]');
  await expect.poll(
    async () => (await statusCell.textContent())?.trim() ?? "",
    { message, timeout: timeoutMs, intervals: [1000, 2000, 5000] },
  ).toMatch(statusPattern);

  return row;
};
