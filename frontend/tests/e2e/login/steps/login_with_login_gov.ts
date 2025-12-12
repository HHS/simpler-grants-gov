/* eslint-disable no-console */
import { Given, setDefaultTimeout, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { authenticator } from 'otplib';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// --- Setup __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load environment variables ---
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

// Debug loaded variables
console.log('STAGING_BASE_URL:', process.env.STAGING_BASE_URL);

// --- Set Cucumber timeout for slow operations (MFA/login) ---
 setDefaultTimeout(30_000); // 30 seconds

// --- Shared browser/context/page for scenario ---
let browser: Browser;
let context: BrowserContext;
let page: Page;

Given('I navigate to the Simpler Grants staging site', async function () {
  const baseUrl = process.env.STAGING_BASE_URL;
  if (!baseUrl) throw new Error('STAGING_BASE_URL not defined in .env.local');

  // Launch browser if not already launched
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
  }

  // Navigate to staging site
  await page.goto(baseUrl);

  // Store in Cucumber world for later steps
  this.page = page;
  this.context = context;
  this.browser = browser;
});

Given('the user is logged in', async function () {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  const mfaKey = process.env.LOGIN_MFA_KEY;

  if (!email || !password || !mfaKey) {
    throw new Error('Missing required environment variables in .env.local');
  }

  // --- Click "Sign In" on staging site ---
  await page.waitForSelector('text=Sign In', { state: 'visible', timeout: 30000 });
  await page.click('text=Sign In');

  // Wait for redirect to Login.gov
  await page.waitForSelector('input[name="user[email]"]', { state: 'visible', timeout: 30000 });

  // Enter login credentials
  await page.fill('input[name="user[email]"]', email);
  await page.fill('input[name="user[password]"]', password);
  await page.click('button[type="submit"]');

  // Handle MFA
  await page.waitForSelector('input[autocomplete="one-time-code"]', { state: 'visible' });
  const oneTimeCode = authenticator.generate(mfaKey);
  // --- Added console log for debugging ---
  console.log('Generated one-time code:', oneTimeCode);
  await page.fill('input[autocomplete="one-time-code"]', oneTimeCode);
  await page.click('button[type="submit"]');

  // Verify login
  await page.waitForSelector(`text=${email}`, { state: 'visible', timeout: 30000 });

  // Store page/context/browser in Cucumber world
  this.page = page;
  this.context = context;
  this.browser = browser;
});

// --- Hook to close browser after all scenarios ---
AfterAll(async () => {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
});
