// Global setup file that runs once before all tests
// Handles authentication and saves the state for reuse across tests

// ============================================================================
// Authentication Verification Flow:
// ============================================================================
// ✅ Check if sign-in button is visible
//    - Not visible → User logged in → Valid ✓
// ✅ Click sign-in button
// ✅ Check for "Sign in for existing users" heading
//    - Present → Invalid → Delete user.json & reauthenticate
// ✅ Check for "Insert your government employee ID" heading
//    - Present → Invalid → Delete user.json & reauthenticate
// ✅ Neither heading present → Valid ✓
// ============================================================================

import { chromium, FullConfig } from '@playwright/test';
import testConfig from './test-config.json' with { type: 'json' };
import * as fs from 'fs';
import * as path from 'path';

// Load configuration from JSON file
const BASE_DOMAIN = testConfig.environment.baseDomain;
const APPLICATION_ID = testConfig.environment.NofoId;
// const directPageUrl = `https://${BASE_DOMAIN}/applications/${APPLICATION_ID}`;
const directPageUrl = `https://${BASE_DOMAIN}`;
const USER_EMAIL = testConfig.credentials.email;
const USER_PASSWORD = testConfig.credentials.password;
const ONE_TIME_CODE = process.env.ONE_TIME_CODE || testConfig.authentication.defaultOneTimeCode;

const AUTH_FILE = 'frontend/tests/e2e/test-data/user.json';
const SETUP_LOG_FILE = 'frontend/tests/e2e/test-data/global-setup.log';

type LogFn = (message: string) => void;
type SoftStepFn = (label: string, action: () => Promise<void>) => Promise<void>;
type AuthFileContext = 'saved' | 'loaded';

function logTroubleshootingBanner(log: LogFn) {
  log('\n========================================');
  log('   TROUBLESHOOTING INSTRUCTIONS');
  log('========================================');
  log('If you are dry-running the test:');
  log('');
  log('1. test-config.json');
  log('   → Update dry run environment and credential');
  log('');
  log('2. user.json');
  log('   → Delete the file');
  log('');
  log('3. global-setup.ts');
  log('   → Search keyword "Renew 1 time code"');
  log('   → Put debug before click submit');
  log('========================================\n');
}

function readAndValidateAuthFile(authFile: string, log: LogFn, contextLabel: AuthFileContext) {
  if (!fs.existsSync(authFile)) {
    log('❌ Auth file was not created');
    throw new Error('Auth file was not created');
  }

  const fileContent = fs.readFileSync(authFile, 'utf-8');
  const fileSizeKB = (Buffer.byteLength(fileContent) / 1024).toFixed(2);

  if (fileContent.length === 0) {
    log('❌ Auth file was created but is empty');
    throw new Error('Auth file is empty');
  }

  try {
    const parsed = JSON.parse(fileContent);

    // Check if session cookie exists
    const hasSessionCookie = parsed.cookies?.some((cookie: { name: string }) => cookie.name === 'session');
    if (!hasSessionCookie) {
      log('❌ Auth file missing session information');
      throw new Error('Auth file missing session information');
    }

    log(`✅ Authentication state file ${contextLabel} and valid (${fileSizeKB} KB)`);
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message === 'Auth file missing session information') {
      throw error;
    }
    log('❌ Auth file saved but contains invalid JSON');
    throw new Error('Auth file contains invalid JSON');
  }
}

async function reauthenticate(
  browser: import('@playwright/test').Browser,
  directPageUrl: string,
  authFile: string,
  log: LogFn
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // login flow
  log('📍 Navigating to application...');
  log(`🌐 Expecting redirect to domain: ${BASE_DOMAIN}`);
  await page.goto(directPageUrl);
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(USER_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Submit' }).click();

  // authentication method selection
  log('🔑 Configuring authentication method...');
  await page.getByRole('link', { name: 'Choose another authentication' }).click();
  await page.getByText('Text message Get one-time').click();
  await page.getByRole('button', { name: 'Continue' }).click();


  // let codeReplaced = false;
  // for (let i = 0; i < 10 && !codeReplaced; i++) {
  //   const inputValue = await page.getByRole('textbox', { name: 'One-time code' }).inputValue();
  //   if (inputValue && inputValue !== 'Check new code') {
  //     log(`✅ One-time code received: ${inputValue.substring(0, 3)}***`);
  //     codeReplaced = true;
  //   } else {
  //     log(`⏳ Waiting for one-time code... (attempt ${i + 1}/10)`);
  //     await page.waitForTimeout(10000);
  //   }
  // }

  // if (!codeReplaced) {
  //   throw new Error('One-time code was not received within 100 seconds');
  // }

  //**-----------Renew 1 time code by sending a new code to the user email or phone, then update the input field with the new code-----------**//
  log('⏳ Check your phone and enter the one-time code...');
  log('📝 INSTRUCTIONS: Enter the code, click Submit, then resume the debugger');
  await page.pause();

  // After resume, check if we're already at the application domain or wait for redirect
  log('⏳ Waiting for authentication to complete and redirect to application...');

  const currentUrl = new URL(page.url());
  const isAlreadyAtApp = currentUrl.hostname.includes(BASE_DOMAIN);

  log(`📍 Current URL after resume: ${page.url()}`);
  log(`🔍 Is at application domain? ${isAlreadyAtApp}`);

  if (!isAlreadyAtApp) {
    // Need to wait for redirect
    try {
      await page.waitForURL((url) => url.hostname.includes(BASE_DOMAIN), { timeout: 60000 });
      log('✅ Successfully redirected to application');
    } catch (error) {
      log(`❌ Redirect timeout. Current URL: ${page.url()}`);
      throw new Error(`Failed to redirect to ${BASE_DOMAIN}. Current URL: ${page.url()}`);
    }
  } else {
    log('✅ Already at application domain');
  }

  // Wait for page to be fully loaded
  try {
    await page.waitForLoadState('load', { timeout: 10000 });
    log('✅ Page loaded successfully');
  } catch (error) {
    log('⚠️  Page load timeout, but continuing anyway...');
  }

  // Additional wait to ensure session cookie is set
  await page.waitForTimeout(2000);

  // save authentication state
  log(`💾 Saving authentication state to: ${path.resolve(authFile)}`);
  await context.storageState({ path: authFile });
  log(`✅ Auth file saved successfully`);
  readAndValidateAuthFile(authFile, log, 'saved');

  // login verification using cookies
  const verifyContext = await browser.newContext({ storageState: authFile });
  //login need to be verified by navigating to the direct page and checking if it redirects to login page or not. If it redirects to login page, it means the authentication state is not valid.
  const verifyPage = await verifyContext.newPage();
  await verifyPage.goto(directPageUrl);


  const verifyUrl = verifyPage.url().toLowerCase();
  const redirectedToLogin = verifyUrl.includes('login') || verifyUrl.includes('signin');
  if (redirectedToLogin) {
    throw new Error(`Login verification failed: redirected to ${verifyPage.url()}`);
  }

  log('✅ Login verification passed using cookies');
  await verifyContext.close();

  await context.close();
}

async function isAuthenticationValid(
  browser: import('@playwright/test').Browser,
  stagingUrl: string,
  authFile: string,
  log: LogFn
): Promise<boolean> {
  const context = await browser.newContext({ storageState: authFile });
  const page = await context.newPage();

  try {
    await page.goto(stagingUrl);

    // Check if sign-in button exists
    const signInButton = page.getByRole('link', { name: 'Sign in' });
    const signInVisible = await signInButton.isVisible().catch(() => false);

    if (!signInVisible) {
      log('✅ Sign-in button not visible; user already logged in');
      await context.close();
      return true;
    }

    // Click sign-in button and check if we land on login page
    log('🔍 Sign-in button visible, clicking to verify authentication status...');
    await signInButton.click();
    await page.waitForLoadState('networkidle');

    // Check for login page heading
    const loginHeading = page.locator('h1.page-heading:has-text("Sign in for existing users")');
    const onLoginPage = await loginHeading.isVisible().catch(() => false);

    if (onLoginPage) {
      log('⚠️  Redirected to login page; authentication has expired');
      await context.close();
      return false;
    }

    // Check for government employee ID page
    const employeeIdHeading = page.locator('h1.page-heading:has-text("Insert your government employee ID")');
    const onEmployeeIdPage = await employeeIdHeading.isVisible().catch(() => false);

    if (onEmployeeIdPage) {
      log('⚠️  Redirected to government employee ID page; authentication has expired');
      await context.close();
      return false;
    }

    log('✅ Authentication is valid');
    await context.close();
    return true;
  } catch (error) {
    log(`⚠️  Unable to verify authentication status: ${String(error)}`);
    await context.close();
    return false;
  }
}

async function verifyAuthenticationBeforeTests(
  browser: import('@playwright/test').Browser,
  appUrl: string,
  authFile: string,
  log: LogFn
): Promise<void> {
  log('\n🔍 Verifying authentication before tests start...');

  try {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    // Navigate to application
    await page.goto(appUrl);
    await page.waitForLoadState('load');

    // Check if "Sign in" button/link is visible
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    const isSignInVisible = await signInLink.isVisible().catch(() => false);

    if (isSignInVisible) {
      log('❌ AUTHENTICATION FAILED: "Sign in" button is visible');
      log('⚠️  This means the session cookie is invalid or expired');
      log('🔄 You need to re-authenticate by running global setup again');
      await context.close();
      throw new Error('Authentication verification failed: "Sign in" button is visible on home page');
    }

    log('✅ Authentication verification PASSED: User is logged in');
    log('✅ "Sign in" button is NOT visible - session is valid');
    log('✅ Ready to run tests');

    await context.close();
  } catch (error) {
    log(`❌ Authentication verification error: ${String(error)}`);
    throw error;
  }
}

async function globalSetup(config: FullConfig) {
  const logLines: string[] = [];
  let errorCount = 0;
  const log = (message: string) => {
    logLines.push(message);
    console.log(message);
  };

  // Ensure auth folder exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    log(`📁 Created auth directory: ${authDir}`);
  }

  const logDir = path.dirname(SETUP_LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  let shouldReauthenticate = true;

  log('🔐 Starting global authentication setup...');
  log(`📄 Auth file path: ${path.resolve(AUTH_FILE)}`);

  let browser: import('@playwright/test').Browser | null = null;

  // Check if authentication state already exists and is valid
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const authData = readAndValidateAuthFile(AUTH_FILE, log, 'loaded') as { cookies?: unknown[] };
      const hasValidCookies = authData.cookies && authData.cookies.length > 0;

      if (hasValidCookies) {
        log(`✅ Using existing authentication state from ${AUTH_FILE}`);
        log('💡 To force re-authentication, delete the file or set FORCE_AUTH=true');

        // Skip authentication if FORCE_AUTH is not set
        if (!process.env.FORCE_AUTH) {
          shouldReauthenticate = false;
        } else {
          log('🔄 FORCE_AUTH detected, re-authenticating...');
        }
      }
    } catch (error) {
      log('⚠️  Invalid auth file, will re-authenticate');
    }
  }

  // If auth file is missing, force re-authentication
  if (!fs.existsSync(AUTH_FILE)) {
    log('⚠️  Auth file missing. Re-authenticating...');
    shouldReauthenticate = true;
  }

  // If we have valid auth file, skip browser launch and authentication
  if (!shouldReauthenticate) {
    log('✅ Using existing valid authentication state. Skipping browser launch.');

    // Still verify authentication is valid before tests
    try {
      const verifyBrowser = await chromium.launch({ headless: true });
      await verifyAuthenticationBeforeTests(verifyBrowser, directPageUrl, AUTH_FILE, log);
      await verifyBrowser.close();
    } catch (error) {
      log(`⚠️  Authentication verification failed: ${String(error)}`);
      log('🔄 Need to re-authenticate. Deleting auth file and re-authenticating...');
      if (fs.existsSync(AUTH_FILE)) {
        fs.unlinkSync(AUTH_FILE);
      }
      shouldReauthenticate = true;
    }
  }

  // Stop if auth is valid
  if (!shouldReauthenticate) {
    fs.writeFileSync(SETUP_LOG_FILE, logLines.join('\n'));
    return;
  }

  // Only launch browser if we need to reauthenticate
  try {
    browser = await chromium.launch({
      headless: false,  // Show browser during authentication
      slowMo: 500       // Slow down actions to see what's happening (optional)
    });

    try {
      await reauthenticate(browser, directPageUrl, AUTH_FILE, log);

      // Verify authentication is valid before tests start
      await verifyAuthenticationBeforeTests(browser, directPageUrl, AUTH_FILE, log);

    } catch (error) {
      log(`❌ Global setup failed: ${String(error)}`);
      logTroubleshootingBanner(log);
    } finally {
      if (browser) {
        await browser.close();
      }
      fs.writeFileSync(SETUP_LOG_FILE, logLines.join('\n'));
    }
  } catch (error) {
    log(`❌ Global setup error: ${String(error)}`);
    log(`📋 Global setup finished with ${errorCount} error(s).`);
    logTroubleshootingBanner(log);
    fs.writeFileSync(SETUP_LOG_FILE, logLines.join('\n'));
  }
}

export default globalSetup;
