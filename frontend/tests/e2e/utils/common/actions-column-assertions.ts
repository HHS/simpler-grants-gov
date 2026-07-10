/**
 * Asserts expected Actions-column links by row status on list views.
 * Usage: import { assertActionsColumnLinksByStatus } from "tests/e2e/utils/common/actions-column-assertions";
 */

import { expect, type Locator } from "@playwright/test";

import { escapeRegex } from "./regex-utils";

type StatusActionRule = {
  visible?: string[];
  hidden?: string[];
};

type ActionsColumnAssertionOptions = {
  status: string;
  statusTextMatches?: string[];
} & (
  | {
      actionLinkVisibility: Record<string, boolean>;
      statusActionRules?: never;
    }
  | {
      statusActionRules: Record<string, StatusActionRule>;
      actionLinkVisibility?: never;
    }
);

/**
 * Assert that a table row shows the expected status and the correct Actions links for that status.
 */
export const assertActionsColumnLinksByStatus = async (
  row: Locator,
  options: ActionsColumnAssertionOptions,
) => {
  const normalizedStatus = options.status.trim().toLowerCase();
  const statusTextMatches = (
    options.statusTextMatches?.length
      ? options.statusTextMatches
      : [options.status]
  )
    .map((value) => value.trim())
    .filter(Boolean);

  const statusPattern = new RegExp(
    `^(${statusTextMatches.map(escapeRegex).join("|")})$`,
    "i",
  );

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

  const statusRule = options.statusActionRules[normalizedStatus];

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
