// actions-column-assertions.ts
// Asserts expected Actions-column links by row status on list views.
// Usage: import { assertActionsColumnLinksByStatus } from "tests/e2e/utils/common/actions-column-assertions";

import { expect, type Locator } from "@playwright/test";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type StatusActionRule = {
  visible?: string[];
  hidden?: string[];
};

export const assertActionsColumnLinksByStatus = async (
  row: Locator,
  options: {
    status: string;
    actionLinkVisibility?: Record<string, boolean>;
    actionLinks?: string[];
    statusActionRules?: Record<string, StatusActionRule>;
  },
) => {
  const normalizedStatus = options.status.trim().toLowerCase();
  const statusPattern =
    normalizedStatus === "published" || normalizedStatus === "posted"
      ? /^(published|posted)$/i
      : new RegExp(`^${escapeRegex(options.status.trim())}$`, "i");

  const statusCell = row
    .locator('td [data-testid^="responsive-data-"][data-testid$="-2"]')
    .first();

  if ((await statusCell.count()) > 0) {
    await expect(statusCell).toHaveText(statusPattern);
  } else {
    await expect(row).toContainText(statusPattern);
  }

  if (options.actionLinkVisibility) {
    for (const [actionText, shouldBeVisible] of Object.entries(
      options.actionLinkVisibility,
    )) {
      const actionLink = row.getByRole("link", {
        name: new RegExp(`^${escapeRegex(actionText)}$`, "i"),
      });

      if (shouldBeVisible) {
        await expect(actionLink).toHaveCount(1);
        await expect(actionLink).toBeVisible();
      } else {
        await expect(actionLink).toHaveCount(0);
      }
    }
    return;
  }

  if (!options.actionLinks && !options.statusActionRules) {
    throw new Error(
      "No action links provided. Pass actionLinks or statusActionRules, or use actionLinkVisibility.",
    );
  }

  const actionLinks = options.actionLinks ?? [];
  const defaultStatusActionRules: Record<string, StatusActionRule> = {
    posted: {
      hidden: actionLinks,
    },
    draft: {
      visible: actionLinks,
    },
  };

  const statusActionRules = {
    ...defaultStatusActionRules,
    ...(options.statusActionRules ?? {}),
  };
  const statusRule = statusActionRules[normalizedStatus];

  if (!statusRule) {
    throw new Error(
      `No action-links rule configured for status: ${options.status}`,
    );
  }

  for (const actionText of statusRule.visible ?? []) {
    const actionLink = row.getByRole("link", {
      name: new RegExp(`^${escapeRegex(actionText)}$`, "i"),
    });
    await expect(actionLink).toHaveCount(1);
    await expect(actionLink).toBeVisible();
  }

  for (const actionText of statusRule.hidden ?? []) {
    const actionLink = row.getByRole("link", {
      name: new RegExp(`^${escapeRegex(actionText)}$`, "i"),
    });
    await expect(actionLink).toHaveCount(0);
  }
};
