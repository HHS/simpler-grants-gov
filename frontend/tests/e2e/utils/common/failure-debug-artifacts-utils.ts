/**
 * Shared failure-debug artifact helpers for E2E Playwright specs.
 *
 * Reviewer guide:
 * - createFailureDebugArtifactsCollector: registers listeners for console errors,
 *   uncaught page errors, request transport failures, and HTTP error responses.
 * - attachOnFailure: attaches a debug bundle only when the test status differs
 *   from expected status to keep successful runs fast and artifact-light.
 *
 * Artifact bundle (on failure):
 * - failure-url: final URL at failure time.
 * - failure-screenshot: full-page screenshot of the final rendered state.
 * - failure-page-source: full HTML source captured after the failure.
 * - failure-console-errors: browser console messages with level error.
 * - failure-page-errors: uncaught runtime exceptions from the page.
 * - failure-request-failures: network transport failures (aborts/timeouts/etc).
 * - failure-http-failures: HTTP responses with status >= 400.
 *
 * Tuning guide:
 * - maxDebugEvents defaults to 100 and caps each captured list so artifacts stay
 *   small and readable while preserving enough context for triage.
 */
import { type Page, type TestInfo } from "@playwright/test";

type NetworkFailureEvent = {
  method: string;
  url: string;
  resourceType: string;
  errorText: string;
};

type HttpFailureEvent = {
  status: number;
  method: string;
  url: string;
  resourceType: string;
};

export type FailureDebugArtifactsCollector = {
  attachOnFailure: (testInfo: TestInfo) => Promise<void>;
};

/**
 * Collect common browser diagnostics and attach them only when a test fails.
 */
export function createFailureDebugArtifactsCollector(
  page: Page,
  maxDebugEvents = 100,
): FailureDebugArtifactsCollector {
  // Keep buffered diagnostics small so attachments stay readable and lightweight.
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const networkFailures: NetworkFailureEvent[] = [];
  const httpFailures: HttpFailureEvent[] = [];

  // Capture browser console errors emitted by client-side code.
  page.on("console", (message) => {
    if (message.type() !== "error" || consoleErrors.length >= maxDebugEvents) {
      return;
    }

    consoleErrors.push(message.text());
  });

  // Capture uncaught runtime exceptions from the page context.
  page.on("pageerror", (error) => {
    if (pageErrors.length >= maxDebugEvents) {
      return;
    }

    pageErrors.push(error.message);
  });

  // Capture transport-level failures (aborts, DNS failures, blocked requests, etc.).
  page.on("requestfailed", (request) => {
    if (networkFailures.length >= maxDebugEvents) {
      return;
    }

    networkFailures.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText ?? "unknown",
    });
  });

  // Capture server-side HTTP failures that still returned a response.
  page.on("response", (response) => {
    if (response.status() < 400 || httpFailures.length >= maxDebugEvents) {
      return;
    }

    const request = response.request();
    httpFailures.push({
      status: response.status(),
      method: request.method(),
      url: response.url(),
      resourceType: request.resourceType(),
    });
  });

  return {
    async attachOnFailure(testInfo: TestInfo): Promise<void> {
      // Only attach artifacts when the test unexpectedly fails.
      if (testInfo.status === testInfo.expectedStatus) {
        return;
      }

      // URL + screenshot + HTML make it easy to reconstruct the final UI state.
      await testInfo.attach("failure-url", {
        body: page.url(),
        contentType: "text/plain",
      });

      await testInfo.attach("failure-screenshot", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });

      await testInfo.attach("failure-page-source", {
        body: await page.content(),
        contentType: "text/html",
      });

      // JSON artifacts preserve the raw diagnostics for post-failure triage.
      await testInfo.attach("failure-console-errors", {
        body: JSON.stringify(consoleErrors, null, 2),
        contentType: "application/json",
      });

      await testInfo.attach("failure-page-errors", {
        body: JSON.stringify(pageErrors, null, 2),
        contentType: "application/json",
      });

      await testInfo.attach("failure-request-failures", {
        body: JSON.stringify(networkFailures, null, 2),
        contentType: "application/json",
      });

      await testInfo.attach("failure-http-failures", {
        body: JSON.stringify(httpFailures, null, 2),
        contentType: "application/json",
      });
    },
  };
}
