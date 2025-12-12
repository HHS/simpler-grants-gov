/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { authenticator } from 'otplib';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from frontend/.env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Validate required env variables
const email = process.env.LOGIN_EMAIL;
const password = process.env.LOGIN_PASSWORD;
const authKey = process.env.LOGIN_MFA_KEY;
const baseUrl = process.env.STAGING_BASE_URL;

if (!email) throw new Error('LOGIN_EMAIL is not defined in .env.local');
if (!password) throw new Error('LOGIN_PASSWORD is not defined in .env.local');
if (!authKey) throw new Error('LOGIN_MFA_KEY is not defined in .env.local');
if (!baseUrl) throw new Error('STAGING_BASE_URL is not defined in .env.local');

// Make browser visible for this test, remove when commit to main
test.use({ headless: false });

test('Login.gov authentication with MFA', async ({ page }) => {
  
  // Navigate to staging site
  await page.goto(baseUrl);

  // Click "Sign In"
  await page.click('text=Sign In');

  // Fill login form
  await page.fill('input[name="user[email]"]', email);
  await page.fill('input[name="user[password]"]', password);
  await page.click('button[type="submit"]');

  // Wait for MFA input
  await page.waitForSelector('input[autocomplete="one-time-code"]', { state: 'visible' });

  // Generate MFA code and submit
  const oneTimeCode = authenticator.generate(authKey);
  console.log('Generated one-time code:', oneTimeCode);
  await page.fill('input[autocomplete="one-time-code"]', oneTimeCode);
  await page.click('button[type="submit"]');

  // Verify successful login
  await expect(
  page.locator('button[data-testid="navDropDownButton"] >> text=' + email)
).toBeVisible({ timeout: 30000 });

});
