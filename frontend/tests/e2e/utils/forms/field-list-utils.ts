import { expect, Page } from "@playwright/test";

/**
 * Adds entries to a field list until it has `count`, so a spec can fill each entry's
 * fields by path, e.g. `senior_key_persons[1]--name--first_name`.
 * @param page Playwright Page object
 * @param fieldListId The list's id, which is its field path, e.g. "senior_key_persons"
 * @param count How many entries the list should have
 */
export async function addFieldListEntries(
  page: Page,
  fieldListId: string,
  count: number,
): Promise<void> {
  const fieldList = page.locator(`[id="${fieldListId}"].field-list-widget`);
  const entries = fieldList.locator(":scope > .field-list-widget__entry");
  const addButton = fieldList.getByRole("button", {
    name: /add another entry/i,
  });

  for (let added = await entries.count(); added < count; added++) {
    await addButton.click();
    await expect(entries).toHaveCount(added + 1);
  }
}
