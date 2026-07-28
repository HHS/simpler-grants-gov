import { type Locator, type Page } from "@playwright/test";

type ResolveTextLocatorOptions = {
  page: Page;
  // Logical key used to build id-based selectors.
  targetKey: string;
  // Text the caller expects to find when id/scoped selectors are unavailable.
  expectedContent: string;
  // Optional selector that scopes fallback lookup to a nearby form group alert.
  contextSelector?: string;
  // When true, allow returning a page-level fallback locator.
  includePageLevelFallback?: boolean;
  // Optional custom page-level locator. If omitted, a default alert locator is used.
  pageLevelLocator?: Locator;
  // Prefix for id-based selectors, e.g. "error-for" -> #error-for-targetKey.
  idPrefix?: string;
};

type ResolvedTextLocator = {
  locator: Locator;
  // false -> caller should assert exact text; true -> caller should assert contains text.
  useContainsText: boolean;
};

const toKebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Reviewer guide (what logic):
 * 1. Resolve by id with camelCase key first.
 * 2. Resolve by id with kebab-case key second.
 * 3. Resolve by nearest alert within context selector when provided.
 * 4. Resolve by page-level locator when enabled.
 * 5. Resolve by broad alert text match as final fallback.
 *
 * Fallback order (most specific to broadest):
 * 1) #{idPrefix}-{camelCaseTargetKey}
 * 2) #{idPrefix}-{kebab-case-target-key}
 * 3) nearest [role='alert'] in the same form group (when contextSelector is provided)
 * 4) page-level fallback locator (only when includePageLevelFallback is true)
 * 5) generic [role='alert'] containing expectedContent
 *
 * Assertion behavior:
 * - useContainsText=false for id/scoped matches (exact text assertions are expected)
 * - useContainsText=true for broad fallbacks (contains-text assertions are expected)
 *
 * Tester parameter guide (what to update):
 * - targetKey: logical key used to resolve id-based locators.
 * - expectedContent: fallback text for broad locators.
 * - contextSelector: narrow lookup to one form-group/section.
 * - includePageLevelFallback/pageLevelLocator: tune page-level assertion behavior.
 * - idPrefix: adapt to alternate id naming conventions.
 */
export async function resolveTextLocator(
  options: ResolveTextLocatorOptions,
): Promise<ResolvedTextLocator> {
  const selectorIdPrefix = options.idPrefix ?? "error-for";

  const camelCaseIdLocator = options.page.locator(
    `#${selectorIdPrefix}-${options.targetKey}`,
  );
  if (await camelCaseIdLocator.count()) {
    return { locator: camelCaseIdLocator, useContainsText: false };
  }

  const kebabCaseIdLocator = options.page.locator(
    `#${selectorIdPrefix}-${toKebabCase(options.targetKey)}`,
  );
  if (await kebabCaseIdLocator.count()) {
    return { locator: kebabCaseIdLocator, useContainsText: false };
  }

  if (options.contextSelector) {
    const contextScopedAlert = options.page
      .locator(options.contextSelector)
      .locator("xpath=ancestor::*[contains(@class,'usa-form-group')][1]")
      .locator("[role='alert']");
    if (await contextScopedAlert.count()) {
      return { locator: contextScopedAlert, useContainsText: false };
    }
  }

  if (options.includePageLevelFallback) {
    const pageLevelLocator =
      options.pageLevelLocator ??
      options.page
        .locator(".usa-alert.usa-alert--error, [data-testid='alert']")
        .filter({ hasText: "Error(s) Found" });
    return { locator: pageLevelLocator, useContainsText: true };
  }

  const broadAlertMatch = options.page
    .locator("[role='alert']")
    .filter({ hasText: options.expectedContent });
  return { locator: broadAlertMatch, useContainsText: true };
}
