/**
 * Opportunity list page locator definitions and helper.
 * Usage: import {
 *   OPPORTUNITIES_LIST_PAGE_DEFINITIONS,
 *   getOpportunityListPageLocator,
 * } from "tests/e2e/opportunity/fixtures/opportunity-list-definition";
 */

import { type Page } from "@playwright/test";

type PlaywrightRole = Parameters<Page["getByRole"]>[0];

export type OpportunityListPageFieldDefinition = {
  label: string;
  role?: PlaywrightRole;
  name?: string | RegExp;
  text?: string | RegExp;
  selector?: string;
};

export const OPPORTUNITIES_LIST_PAGE_DEFINITIONS: Record<
  string,
  OpportunityListPageFieldDefinition
> = {
  pageHeading: {
    label: "Opportunities list heading",
    role: "heading",
    name: /opportunities list/i,
  },

  opportunitiesCount: {
    label: "Opportunities count",
    text: /\d+ opportunities?/i,
  },

  createOpportunityLink: {
    label: "Create opportunity link",
    role: "link",
    name: /create opportunity/i,
  },

  opportunitiesTable: {
    label: "Opportunities table",
    role: "table",
  },

  titleColumnHeader: {
    label: "Title column header",
    role: "columnheader",
    name: /title/i,
  },

  statusColumnHeader: {
    label: "Status column header",
    role: "columnheader",
    name: /status/i,
  },

  actionColumnHeader: {
    label: "Action column header",
    role: "columnheader",
    name: /action/i,
  },

  pageOneButton: {
    label: "Page one button",
    role: "button",
    name: /page 1/,
  },

  nextButton: {
    label: "Next button",
    role: "button",
    name: /next/i,
  },
};

export function getOpportunityListPageLocator(
  page: Page,
  definition: OpportunityListPageFieldDefinition,
) {
  if (definition.role) {
    const options = definition.name
      ? { name: definition.name }
      : undefined;

    return page.getByRole(definition.role, options);
  }

  if (definition.text) {
    return page.getByText(definition.text);
  }

  if (definition.selector) {
    return page.locator(definition.selector);
  }

  throw new Error(
    `Invalid opportunity list page field definition: ${definition.label}`,
  );
}