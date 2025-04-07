import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3000';

test.describe('Login Page Redirect', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
    });
    await page.context().addCookies([
      {
        name: '_ff',
        value: JSON.stringify({ authOn: true }),
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
  });

  test('should redirect to home page when no redirect URL is stored', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('should redirect to stored URL after login', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('login-redirect', '/opportunities');
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/opportunities`);
  });

  test('should redirect to home page when stored URL is empty', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('login-redirect', '');
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('should redirect to home page when stored URL is external', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('login-redirect', 'https://external.com');
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('should display "Redirecting..." text while redirecting', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('login-redirect', '/opportunities');
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByText('Redirecting...')).toBeVisible();
  });

  test('should handle redirect after successful login flow', async ({ page }) => {
    // Navigate to opportunities page and wait for it to load
    await page.goto(`${BASE_URL}/opportunities`);
    await page.waitForLoadState('networkidle');
    
    // Wait for the sign-in button to be ready
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    await signInButton.waitFor({ state: 'visible' });
    await signInButton.click();
    
    // Wait for the modal to be mounted
    const modal = page.locator('#login-modal');
    await modal.waitFor({ state: 'attached' });
    
    // Wait for the login link to be visible
    const loginLink = page.getByRole('link', { name: 'Login' });
    await loginLink.waitFor({ state: 'visible' });
    await loginLink.click();
    
    // Wait for the redirect to the login URL
    await page.waitForURL('http://localhost:8080/v1/users/login');
  });
}); 