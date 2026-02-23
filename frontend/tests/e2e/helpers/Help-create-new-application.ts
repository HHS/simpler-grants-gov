// ============================================================================
// Help - Create New Application
// ============================================================================
// Helper function to create a new application with timestamp-based naming
// and verify the application creation flow
// ============================================================================
// Replace console-based logging with testInfo attachment
import { expect, Page, TestInfo } from "@playwright/test";
import testConfig from "tests/e2e/test-data/test-config.json" assert { type: "json" };
import * as fs from "fs";
import * as path from "path";
import {
  safeHelp_clickButton,
  safeHelp_getTimestamp,
  safeHelp_safeExpect,
  safeHelp_safeSelectOption,
  safeHelp_fillFieldsByTestId,
  safeHelp_safeGoto,
} from "tests/e2e/helpers/safeHelp";

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
  level: "log" | "warn" | "error" = "log"
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
  applicantType: string = "INDIVIDUAL"
): Promise<{
  appLinkName: string;
  Nofo_directPageUrl: string;
  applicationId: string;
}> {
  const opportunityId = testConfig.environment.NofoId;
  const opportunityUrl = `/opportunity/${opportunityId}`;

  await safeHelp_safeGoto(testInfo, page, opportunityUrl);
  await safeHelp_safeExpect(testInfo, async () =>
    expect(page.getByTestId("open-start-application-modal-button")).toContainText(
      "Start new application"
    )
  );

  await safeHelp_clickButton(
    testInfo,
    page,
    "open start application modal",
    "open-start-application-modal-button"
  );

  const appLinkName = `Automate Test data at ${safeHelp_getTimestamp()}`;
  await safeHelp_safeSelectOption(testInfo, page.getByTestId('Select'), applicantType);
  await safeHelp_safeExpect(testInfo, async () =>
    expect(page.getByTestId("textInput")).toBeVisible()
  );
  await safeHelp_fillFieldsByTestId(testInfo, page, [
    { testId: "textInput", value: appLinkName }
  ]);

  await safeHelp_clickButton(
    testInfo,
    page,
    "save application",
    "application-start-save"
  );

  const originalUrl = page.url();
  let urlChanged = false;
  try {
    await page.waitForURL(
      (url) => {
        const urlStr = url.toString();
        const changed =
          (urlStr.includes("/application/") || urlStr.includes("/applications/")) &&
          urlStr !== originalUrl;
        urlChanged = changed;
        return changed;
      },
      { timeout: 60000 }
    );
  } catch (error) {
    urlChanged = false;
    await safeLog(
      testInfo,
      "❌ URL did not change to application page within 60 seconds. Application creation failed. Current URL: " + page.url(),
      "error"
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
    await safeLog(testInfo, `📝 Extracted Application ID: ${applicationIdFromUrl}`);
  } else {
    await safeLog(testInfo, `❌ Application creation failed: URL did not change. Still at: ${currentUrl}`, "error");
    applicationIdFromUrl = "unknown";
  }

  if (urlChanged) {
    await safeHelp_safeExpect(testInfo, async () =>
      expect(
        page.getByTestId("information-card").getByRole("heading")
      ).toContainText(`This is a test-${appLinkName}Edit filing name`)
    );

    await safeHelp_safeExpect(testInfo, async () =>
      expect(
        page.getByTestId("information-card").getByTestId("button")
      ).toContainText("Submit application")
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
        "../test-data/applicationCreatedFromTest.json"
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
        "💾 Application data added to applicationCreatedFromTest.json"
      );
      await safeLog(testInfo, `   - Application ID: ${applicationIdFromUrl}`);
      await safeLog(testInfo, `   - Application Name: ${appLinkName}`);
      await safeLog(
        testInfo,
        `   - Total applications created: ${fileContent.createdApplications.length}`
      );
    } catch (error) {
      await safeLog(
        testInfo,
        `⚠️  Could not save to applicationCreatedFromTest.json: ${String(error)}`,
        "warn"
      );
    }
  }

  return {
    appLinkName,
    Nofo_directPageUrl: getNofoDirectPageUrl(page),
    applicationId: applicationIdFromUrl,
  };
}
