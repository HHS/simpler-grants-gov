import { expect, Page } from "@playwright/test";

export async function testCharacterLimit(
  page: Page,
  label: string,
  invalidValue: string,
  expectedMessage: string
) {
  const textbox = page.getByRole("textbox", { name: label });
  await textbox.fill(""); // Clear field first for reliability
  await textbox.fill(invalidValue);
  const messageLocator = page.getByTestId("characterCountMessage").first();
  await expect(messageLocator, `Character count message for '${label}'`).toHaveText(expectedMessage);
}
