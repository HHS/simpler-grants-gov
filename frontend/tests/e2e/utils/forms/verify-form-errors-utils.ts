import { expect, type Page } from "@playwright/test";

export interface FieldError {
  fieldId: string;
  message: string;
}

function normalizeWhitespace(value: string): string {
  // Normalize spacing so minor copy formatting changes (extra spaces/newlines)
  // do not cause false failures when comparing alert text.
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Verifies error messages appear in the top alert list on the form page after save.
 * Assumes navigation to the form page has already occurred.
 * @param page Playwright Page object
 * @param expectedErrors List of field errors to verify in the alert list
 */
export async function verifyAlertErrors(
  page: Page,
  expectedErrors: FieldError[],
): Promise<void> {
  const alertList = page.getByTestId("alert").getByRole("list");
  const alertItems = alertList.getByRole("listitem");

  // 1) Exact count check: catches unexpected extra/missing alert errors.
  await expect(alertItems).toHaveCount(expectedErrors.length);

  // 2) Set-equality check on alert messages: catches wrong messages even when
  // the count happens to match.
  const actualMessages = (await alertItems.allTextContents())
    .map(normalizeWhitespace)
    .sort();
  const expectedMessages = expectedErrors
    .map(({ message }) => normalizeWhitespace(message))
    .sort();
  expect(actualMessages).toEqual(expectedMessages);

  // 3) If alert entries link to inline errors, verify those links point to the
  // exact expected field IDs (prevents silent field-mapping drift).
  const alertErrorLinks = alertList.locator('a[href*="error-for-"]');
  if ((await alertErrorLinks.count()) > 0) {
    const actualLinkedFieldIds = (
      await alertErrorLinks.evaluateAll((nodes) =>
        nodes
          .map((n) => {
            const href = n.getAttribute("href") ?? "";
            const match = href.match(/#?error-for-(.+)$/);
            return match?.[1] ?? "";
          })
          .filter(Boolean),
      )
    ).sort();
    const expectedFieldIds = expectedErrors.map(({ fieldId }) => fieldId).sort();
    expect(actualLinkedFieldIds).toEqual(expectedFieldIds);
  }

  for (const { message } of expectedErrors) {
    await expect(alertList).toContainText(message);
  }
}

/**
 * Scrolls down on the form page and verifies inline field-level error messages.
 * Assumes navigation to the form page has already occurred.
 * @param page Playwright Page object
 * @param expectedErrors List of field errors to verify inline on the form
 */
export async function verifyInlineErrors(
  page: Page,
  expectedErrors: FieldError[],
): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // 1) Exact count check: catches unexpected extra/missing inline errors.
  const inlineErrors = page.locator('[id^="error-for-"]');
  await expect(inlineErrors).toHaveCount(expectedErrors.length);

  // 2) Set-equality check on inline field IDs: catches wrong fields even when
  // the count happens to match.
  const actualInlineFieldIds = (
    await inlineErrors.evaluateAll((nodes) =>
      nodes.map((n) => n.id.replace(/^error-for-/, "")),
    )
  ).sort();
  const expectedInlineFieldIds = expectedErrors
    .map(({ fieldId }) => fieldId)
    .sort();
  expect(actualInlineFieldIds).toEqual(expectedInlineFieldIds);

  for (const { fieldId, message } of expectedErrors) {
    const errorLocator = page.locator(`#error-for-${fieldId}`);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText(message);
  }
}
