import { type Locator, type Page } from "@playwright/test";

/**
 * Gets a form link element by matching form name text.
 * @param page Playwright Page object
 * @param formName Form name or pattern to match (case-insensitive)
 * @returns Locator for the form link
 */
export function getFormLink(page: Page, formName: string): Locator {
  return page.locator("a, button").filter({
    hasText: new RegExp(formName, "i"),
  });
}

/**
 * Converts a plain form name string into a flexible regex that allows
 * optional whitespace and optional hyphens (e.g. "SF-424B" -> /SF-?424B/i).
 */
export function buildFlexibleFormNameRegex(formName: string): RegExp {
  const escaped = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexible = escaped.replace(/\s+/g, "\\s*").replace(/-/g, "-?");
  return new RegExp(flexible, "i");
}

/**
 * Opens a form from the application forms table.
 * @param page Playwright Page object
 * @param formMatcher Form name or regex-style matcher used to find the form link
 * @returns true when a link was found and opened, false otherwise
 */
export async function openForm(
  page: Page,
  formMatcher: string | RegExp,
): Promise<boolean> {
  const formNameRegex =
    formMatcher instanceof RegExp ? formMatcher : new RegExp(formMatcher, "i");

  // Check if we're already on the correct form page
  const currentUrl = page.url();
  const isOnFormPage = /\/applications\/[a-f0-9-]+\/form\/[a-f0-9-]+/.test(
    currentUrl,
  );

  if (isOnFormPage) {
    // Verify the form heading matches the expected form name
    const formHeadingCount = await page
      .getByText(formNameRegex)
      .first()
      .count();

    if (formHeadingCount > 0) {
      // Already on the correct form page
      return true;
    }
  }

  // Not on the form page or on wrong form - proceed with navigation
  const formsTable = page.locator(".simpler-application-forms-table").first();

  try {
    await formsTable.waitFor({ state: "visible", timeout: 60000 });
  } catch (error) {
    // If the table doesn't appear, check if the page loaded at all
    const pageContent = await page.content();
    const hasTableClass = pageContent.includes(
      "simpler-application-forms-table",
    );
    const hasFormLinks = (await page.locator('a[href*="/form/"]').count()) > 0;

    if (!hasTableClass && !hasFormLinks) {
      throw new Error(
        `Forms table failed to load. Page may not have rendered properly. ` +
          `URL: ${page.url()}`,
      );
    }

    // If we have form links but not the table, continue with the form links
    if (hasFormLinks) {
      // Proceed to find form by href link instead
    } else {
      throw error;
    }
  }

  const rowCandidates = formsTable.locator("tbody tr").filter({
    hasText: formNameRegex,
  });

  // Some environments render the forms table lower on the page.
  // Perform a few small page scrolls to reveal links before selecting.
  for (let i = 0; i < 5; i++) {
    if ((await rowCandidates.count()) > 0) {
      break;
    }
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(250);
  }

  let formTrigger: Locator | null = null;
  if ((await rowCandidates.count()) > 0) {
    const row = rowCandidates.first();
    // Uses stable selector for form link click, improving reliability across environments.
    const rowLink = row
      .locator('[data-testid="application-form-link"]')
      .filter({ hasText: formNameRegex })
      .first();
    // Fallback to href/button if not found.
    const rowHrefLink = row
      .locator('a[href*="/applications/"][href*="/form/"]')
      .first();
    const rowButton = row.locator("button").first();

    if ((await rowLink.count()) > 0) {
      formTrigger = rowLink;
    } else if ((await rowHrefLink.count()) > 0) {
      formTrigger = rowHrefLink;
    } else if ((await rowButton.count()) > 0) {
      formTrigger = rowButton;
    }
  }

  // Global fallback in case table structure differs.
  if (!formTrigger) {
    const linkCandidates = page.locator("a:visible").filter({
      hasText: formNameRegex,
    });
    const buttonCandidates = page.locator("button:visible").filter({
      hasText: formNameRegex,
    });
    if ((await linkCandidates.count()) > 0) {
      formTrigger = linkCandidates.first();
    } else if ((await buttonCandidates.count()) > 0) {
      formTrigger = buttonCandidates.first();
    }
  }

  if (!formTrigger) return false;

  await formTrigger.scrollIntoViewIfNeeded();
  await formTrigger.waitFor({ state: "visible", timeout: 60000 });
  const targetUrlRegex = /\/applications\/[a-f0-9-]+\/form\/[a-f0-9-]+/;
  const directHref = await formTrigger.getAttribute("href");

  const waitForFormUrl = () =>
    page.waitForURL(targetUrlRegex, {
      timeout: 45000,
    });

  // Ensure clickability in case sticky headers or overlays shift during scroll.
  try {
    await formTrigger.click({ trial: true });
  } catch {
    // continue to click/goto fallbacks below
  }

  try {
    await Promise.all([waitForFormUrl(), formTrigger.click()]);
  } catch {
    try {
      // Fallback when click is intercepted by transient overlays.
      await Promise.all([waitForFormUrl(), formTrigger.click({ force: true })]);
    } catch {
      // Last resort: navigate directly to the form URL if this is an anchor.
      if (directHref) {
        await page.goto(directHref, { waitUntil: "domcontentloaded" });
      } else {
        return false;
      }
    }
  }

  if (!targetUrlRegex.test(page.url())) {
    return false;
  }
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  return true;
}

// Opens an application form without handling authentication. Use this when the user is already authenticated.
export async function openApplicationForm(
  page: Page,
  applicationUrl: string,
  formMatcher: string | RegExp,
): Promise<void> {
  await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
  const opened = await openForm(page, formMatcher);
  if (!opened) {
    throw new Error(`Could not find or open form: ${formMatcher}`);
  }
}
