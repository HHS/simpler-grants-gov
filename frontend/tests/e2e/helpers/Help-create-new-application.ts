// ============================================================================
// Help - Create New Application
// ============================================================================
// Helper function to create a new application with timestamp-based naming
// and verify the application creation flow
// ============================================================================
// Replace console-based logging with testInfo attachment
import * as fs from "fs";
import * as path from "path";
import { expect, Page, TestInfo } from "@playwright/test";
import {
  safeHelp_clickButton,
  safeHelp_fillFieldsByTestId,
  safeHelp_getTimestamp,
  safeHelp_safeExpect,
  safeHelp_safeGoto,
  safeHelp_safeSelectOption,
} from "tests/e2e/helpers/safeHelp";
import testConfig from "tests/e2e/test-data/test-config.json" with { type: "json" };

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

const ENABLE_LOGGING = true;

/**
 * Safe logging function that attaches to test report
 * @param testInfo - Playwright TestInfo object
 * @param message - Message to log
 * @param level - Log level (log, warn, error)
 */
async function safeLog(
  testInfo: TestInfo,
  message: string,
  level: "log" | "warn" | "error" = "log",
): Promise<void> {
  if (!ENABLE_LOGGING) return;
  const timestamp = new Date().toISOString();
  const logEntry = `[${level.toUpperCase()}] ${timestamp}: ${message}`;
  await testInfo.attach(`log-${level}`, {
    body: logEntry,
    contentType: "text/plain",
  });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_DOMAIN = testConfig.environment.baseDomain;
const NOFO_ID = testConfig.environment.NofoId;

/**
 * Returns the direct opportunity URL using the current page's origin.
 * @param page Playwright Page object
 */
function getNofoDirectPageUrl(page: Page): string {
  return `${page.url().split("/").slice(0, 3).join("/")}/opportunity/${NOFO_ID}`;
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Create a new application with timestamp-based naming
 * Navigates to opportunity page, opens modal, creates application, and verifies creation
 * Extracts the application ID from the URL after creation
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param applicantType - Applicant type (INDIVIDUAL, ORGANIZATION)
 * @returns Promise that resolves to object containing appLinkName, Nofo_directPageUrl, and applicationId (from URL)
 */
export async function Help_createNewApplication(
  testInfo: TestInfo,
  page: Page,
  applicantType = "INDIVIDUAL",
): Promise<{
  appLinkName: string;
  Nofo_directPageUrl: string;
  applicationId: string;
}> {
  // Ensure the page is not closed before proceeding
  if (page.isClosed()) {
    throw new Error(
      "The page is already closed at the start of Help_createNewApplication.",
    );
  }

  const opportunityId = testConfig.environment.NofoId;
  const opportunityUrl = `/opportunity/${opportunityId}`;
  // Navigate to the opportunity page and verify the "Start new application" button is visible
  await safeHelp_safeGoto(testInfo, page, opportunityUrl);
  await safeHelp_safeExpect(testInfo, async () =>
    expect(
      page.getByTestId("open-start-application-modal-button"),
    ).toContainText("Start new application"),
  );
  // Handle potential mobile Chrome click issues with a fallback to JS click
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width <= 600;
  const isChrome = await isChromeBrowser(page);

  // If on mobile Chrome, use a JS click as a fallback for the "Start new application" button
  if (isMobile && isChrome) {
    // Fallback: Use direct click or JS if Playwright's click doesn't work
    const button = page.getByTestId("open-start-application-modal-button");
    await button.scrollIntoViewIfNeeded();
    const elementHandle = await button.elementHandle();
    if (elementHandle) {
      await elementHandle.evaluate((el) => (el as HTMLElement).click());
      await safeLog(
        testInfo,
        "⚠️ Used JS click fallback for mobile Chrome on start application modal",
      );
    } else {
      await safeLog(
        testInfo,
        "❌ Could not find button element for JS click fallback.",
        "error",
      );
    }
  } else {
    await safeHelp_clickButton(
      testInfo,
      page,
      "open start application modal",
      "open-start-application-modal-button",
    );
  }

  const appLinkName = `Automate Test data at ${safeHelp_getTimestamp()}`;
  await safeHelp_safeSelectOption(
    testInfo,
    page.getByTestId("Select"),
    applicantType,
  );
  await safeHelp_safeExpect(testInfo, async () =>
    expect(page.getByTestId("textInput")).toBeVisible(),
  );
  await safeHelp_fillFieldsByTestId(testInfo, page, [
    { testId: "textInput", value: appLinkName },
  ]);

  if (isMobile && isChrome) {
    await Promise.race([
      (async () => {
        await mobileChromeAction(
          page,
          page.getByTestId("application-start-save"),
          "click",
          undefined,
          undefined,
          testInfo,
        );
      })(),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("Timeout exceeded")), 10000),
      ),
    ]);
  } else {
    await safeHelp_clickButton(
      testInfo,
      page,
      "save application",
      "application-start-save",
    );
  }

  const originalUrl = page.url();
  let urlChanged = false;
  try {
    await page.waitForURL(
      (url) => {
        const urlStr = url.toString();
        const changed =
          (urlStr.includes("/application/") ||
            urlStr.includes("/applications/")) &&
          urlStr !== originalUrl;
        urlChanged = changed;
        return changed;
      },
      { timeout: 60000 },
    );
  } catch (error) {
    urlChanged = false;
    await safeLog(
      testInfo,
      "❌ URL did not change to application page within 60 seconds. Application creation failed. Current URL: " +
      page.url(),
      "error",
    );
  }

  await page.waitForLoadState("load");

  const currentUrl = page.url();
  const urlParts = currentUrl.split("/").filter((part) => part.length > 0);

  let applicationIdFromUrl = "unknown";
  if (urlChanged) {
    const appIndex = urlParts.indexOf("application");
    if (appIndex !== -1 && appIndex + 1 < urlParts.length) {
      applicationIdFromUrl = urlParts[appIndex + 1];
    } else {
      const appsIndex = urlParts.indexOf("applications");
      if (appsIndex !== -1 && appsIndex + 1 < urlParts.length) {
        applicationIdFromUrl = urlParts[appsIndex + 1];
      } else if (urlParts.length > 0) {
        const lastSegment = urlParts[urlParts.length - 1];
        if (
          lastSegment &&
          !lastSegment.includes(".") &&
          !lastSegment.includes(":")
        ) {
          applicationIdFromUrl = lastSegment;
        }
      }
    }
    await safeLog(testInfo, `📍 Application URL changed: ${currentUrl}`);
    await safeLog(
      testInfo,
      `📝 Extracted Application ID: ${applicationIdFromUrl}`,
    );
  } else {
    await safeLog(
      testInfo,
      `❌ Application creation failed: URL did not change. Still at: ${currentUrl}`,
      "error",
    );
    applicationIdFromUrl = "unknown";
  }

  await testInfo.attach("application-details", {
    body: `App Name: ${appLinkName}\nDirect URL: ${getNofoDirectPageUrl(page)}\nApplication ID: ${applicationIdFromUrl}`,
    contentType: "text/plain",
  });

  if (urlChanged) {
    await safeHelp_safeExpect(testInfo, async () =>
      expect(
        page.getByTestId("information-card").getByRole("heading"),
      ).toContainText(`This is a test-${appLinkName}Edit filing name`),
    );

    await safeHelp_safeExpect(testInfo, async () =>
      expect(
        page.getByTestId("information-card").getByTestId("button"),
      ).toContainText("Submit application"),
    );

    const successMessage = `✅ Successfully created application: ${appLinkName}\nOpportunity ID: ${NOFO_ID}\nApplication ID: ${applicationIdFromUrl}\nURL: ${currentUrl}\nTime: ${new Date().toISOString()}`;
    await safeLog(testInfo, successMessage);
    await testInfo.attach("application-created", {
      body: successMessage,
      contentType: "text/plain",
    });
  } else {
    const failMessage = `❌ Failed to create application: ${appLinkName}\nOpportunity ID: ${NOFO_ID}\nURL: ${currentUrl}\nTime: ${new Date().toISOString()}`;
    await safeLog(testInfo, failMessage, "error");
    await testInfo.attach("application-creation-failed", {
      body: failMessage,
      contentType: "text/plain",
    });
  }

  if (urlChanged) {
    try {
      const configPath = path.resolve(
        __dirname,
        "../test-data/applicationCreatedFromTest.json",
      );

      let fileContent: {
        baseDomain: string;
        NofoId: string;
        createdApplications: Array<{
          applicationId: string;
          applicationName: string;
          createdAt: string;
        }>;
      };
      try {
        const existingData = fs.readFileSync(configPath, "utf-8");
        fileContent = JSON.parse(existingData);
      } catch (readError) {
        fileContent = {
          baseDomain: BASE_DOMAIN,
          NofoId: NOFO_ID,
          createdApplications: [],
        };
      }

      const newApplicationEntry = {
        applicationId: applicationIdFromUrl,
        applicationName: appLinkName,
        createdAt: new Date().toISOString(),
      };

      if (!Array.isArray(fileContent.createdApplications)) {
        fileContent.createdApplications = [];
      }
      fileContent.createdApplications.push(newApplicationEntry);

      fs.writeFileSync(configPath, JSON.stringify(fileContent, null, 2));
      await safeLog(
        testInfo,
        "💾 Application data added to applicationCreatedFromTest.json",
      );
      await safeLog(testInfo, `   - Application ID: ${applicationIdFromUrl}`);
      await safeLog(testInfo, `   - Application Name: ${appLinkName}`);
      await safeLog(
        testInfo,
        `   - Total applications created: ${fileContent.createdApplications.length}`,
      );
    } catch (error) {
      await safeLog(
        testInfo,
        `⚠️  Could not save to applicationCreatedFromTest.json: ${String(error)}`,
        "warn",
      );
    }
  }

  return {
    appLinkName,
    Nofo_directPageUrl: getNofoDirectPageUrl(page),
    applicationId: applicationIdFromUrl,
  };
}

/**
 * Checks if the browser is Chrome based on the user agent.
 * @param page Playwright Page object
 * @returns Promise<boolean>
 */
async function isChromeBrowser(page: Page): Promise<boolean> {
  if (page.isClosed()) return false;
  const userAgent = await page.evaluate(() => navigator.userAgent);
  return userAgent.includes("Chrome");
}

async function mobileChromeAction(
  page: Page,
  locator: ReturnType<Page["getByTestId"]>,
  action: "click" | "fill" | "expect",
  value?: string,
  _unused?: undefined,
  testInfo?: TestInfo,
): Promise<void> {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width <= 600;
  const isChrome = await isChromeBrowser(page);

  if (isMobile && isChrome) {
    const elementHandle = await locator.elementHandle();
    if (!elementHandle)
      throw new Error("Element not found for mobile Chrome fallback.");
    if (action === "click") {
      await locator.scrollIntoViewIfNeeded();
      await elementHandle.evaluate((el: Element) =>
        (el as HTMLElement).click(),
      );
      if (testInfo)
        await safeLog(testInfo, "⚠️ Used JS click fallback for mobile Chrome");
    } else if (action === "fill" && value !== undefined) {
      await locator.scrollIntoViewIfNeeded();
      await elementHandle.evaluate(
        (el: Element, v: string) => ((el as HTMLInputElement).value = v),
        value,
      );
      if (testInfo)
        await safeLog(testInfo, "⚠️ Used JS fill fallback for mobile Chrome");
    } else if (action === "expect" && value !== undefined) {
      const text: string = await elementHandle.evaluate(
        (el: Element) => (el as HTMLElement).textContent || "",
      );
      if (!text.includes(value)) {
        throw new Error(
          `Expected text "${value}" not found in element (mobile Chrome fallback).`,
        );
      }
      if (testInfo)
        await safeLog(testInfo, "⚠️ Used JS expect fallback for mobile Chrome");
    }
  } else {
    if (action === "click") {
      await locator.click();
    } else if (action === "fill" && value !== undefined) {
      await locator.fill(value);
    } else if (action === "expect" && value !== undefined) {
      await expect(locator).toContainText(value);
    }
  }
}
