import { Page } from "@playwright/test";

/**
 * Select a local test user from the dev-only dropdown if present.
 * This is a no-op in CI where the dropdown is not rendered.
 */
export async function selectLocalTestUser(
  page: Page,
  userLabel: string,
): Promise<void> {
  const testUserSelect = page.locator(
    'select[id*="test-user"], select[aria-label*="test-user"], combobox[aria-label*="test"]',
  );

  if ((await testUserSelect.count()) === 0) return;

  await testUserSelect.first().waitFor({ state: "visible", timeout: 10_000 });

  const loginResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      response.url().includes("/api/user/local-quick-login")
    );
  });

  await testUserSelect.first().selectOption({ label: userLabel });
  await loginResponse;
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}
