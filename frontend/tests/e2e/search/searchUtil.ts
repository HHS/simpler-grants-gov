// =========================
// Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";

export function getSearchInput(page: Page) {
  return page.locator("#query");
}

export async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  await searchInput.fill(term);
  await page.click(".usa-search >> button[type='submit']");
  expectURLContainsQueryParamValue(page, "query", term);
}

export function expectURLContainsQueryParamValue(
  page: Page,
  queryParamName: string,
  queryParamValue: string,
) {
  const currentURL = page.url();
  expect(currentURL).toContain(`${queryParamName}=${queryParamValue}`);
}

export async function clickSearchNavLink(page: Page) {
  await page.click("nav >> text=Search");
}

export async function expectCheckboxIDIsChecked(
  page: Page,
  idWithHash: string,
) {
  const checkbox: Locator = page.locator(idWithHash);
  await expect(checkbox).toBeChecked();
}

export async function toggleCheckbox(page: Page, idWithoutHash: string) {
  const checkBox = page.locator(`label[for=${idWithoutHash}]`);
  await checkBox.isEnabled();
  await checkBox.click();
}

export async function refreshPageWithCurrentURL(page: Page) {
  const currentURL = page.url();
  await page.goto(currentURL); // go to new url in same tab
  return page;
}

export async function selectSortBy(page: Page, sortByValue: string) {
  await page.locator("#search-sort-by-select").selectOption(sortByValue);
}

export async function waitForSearchResultsLoaded(page: Page) {
  // Wait for number of opportunities to show
  const resultsHeading = page.locator('h2:has-text("Opportunities")');
  await resultsHeading.waitFor({ state: "visible", timeout: 60000 });
}

export async function clickAccordionWithTitle(
  page: Page,
  accordionTitle: string,
) {
  await page
    .locator(`button.usa-accordion__button:has-text("${accordionTitle}")`)
    .click();
}
