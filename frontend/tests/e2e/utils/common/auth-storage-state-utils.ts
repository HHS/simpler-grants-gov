/**
 * Shared authentication and lifecycle helpers for E2E Playwright specs.
 *
 * Reviewer guide:
 * - createAuthenticatedStorageState: logs in once and returns a reusable storage state.
 *   Call this in beforeAll so auth cost is paid only once per worker.
 * - createPageWithStorageState: creates a fresh browser context + page from a stored auth state.
 *   Call this in beforeEach so each test gets an isolated page without re-authenticating.
 * - createAuthenticatedPageLifecycle: convenience factory that wires both helpers into
 *   beforeAll / beforeEach / afterEach callbacks ready to pass to test.beforeAll etc.
 *   Returns getPage() and getContext() accessors for use inside test bodies.
 *
 * Tester parameter guide:
 * - targetEnv: pass playwrightEnv.targetEnv from the spec; controls staging-only skip logic.
 * - skipTest: pass (condition, description) => test.skip(condition, description) from the spec.
 * - timeoutMs: defaults to 300 000 ms; override per spec if needed.
 * - stagingProjectName: defaults to "Chrome"; staging MFA is limited to one browser.
 * - stagingSkipMessage: override the skip reason text if needed.
 */
import {
  type Browser,
  type BrowserContext,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
  type TestInfo,
  type WorkerInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";

export type AuthenticatedStorageState = Awaited<
  ReturnType<BrowserContext["storageState"]>
>;

/**
 * Authenticates once and returns a reusable Playwright storage state.
 */
export async function createAuthenticatedStorageState(
  browser: Browser,
  projectName: string,
): Promise<AuthenticatedStorageState> {
  const authContext = await browser.newContext();
  const authPage = await authContext.newPage();

  await authenticateE2eUser(
    authPage,
    authContext,
    !!projectName.match(/[Mm]obile/),
  );

  const storageState = await authContext.storageState();
  await authContext.close();
  return storageState;
}

/**
 * Creates a new browser context and page from an authenticated storage state.
 */
export async function createPageWithStorageState(
  browser: Browser,
  storageState: AuthenticatedStorageState,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  return { context, page };
}

type AuthLifecycleOptions = {
  timeoutMs?: number;
  stagingProjectName?: string;
  stagingSkipMessage?: string;
  skipTest?: (condition: boolean, description: string) => void;
};

/**
 * Registers one-login-per-spec lifecycle callbacks that can be wired into
 * beforeAll/beforeEach/afterEach in any spec file.
 */
export function createAuthenticatedPageLifecycle(
  options: AuthLifecycleOptions,
) {
  const timeoutMs = options.timeoutMs ?? 300_000;
  const stagingProjectName = options.stagingProjectName ?? "Chrome";
  const stagingSkipMessage =
    options.stagingSkipMessage ??
    "Staging MFA login is limited to Chrome to avoid OTP rate-limiting";

  let authenticatedStorageState: AuthenticatedStorageState | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  return {
    beforeAll: async (
      { browser }: PlaywrightWorkerArgs & PlaywrightWorkerOptions,
      workerInfo: WorkerInfo,
    ): Promise<void> => {
      if (
        playwrightEnv.targetEnv !== "local" &&
        workerInfo.project.name !== stagingProjectName
      ) {
        return;
      }

      authenticatedStorageState = await createAuthenticatedStorageState(
        browser,
        workerInfo.project.name,
      );
    },

    beforeEach: async (
      {
        browser,
      }: PlaywrightTestArgs &
        PlaywrightTestOptions &
        PlaywrightWorkerArgs &
        PlaywrightWorkerOptions,
      testInfo: TestInfo,
    ): Promise<void> => {
      testInfo.setTimeout(timeoutMs);

      if (playwrightEnv.targetEnv !== "local") {
        options.skipTest?.(
          testInfo.project.name !== stagingProjectName,
          stagingSkipMessage,
        );
      }

      if (!authenticatedStorageState) {
        throw new Error("Authenticated storage state was not initialized");
      }

      const authenticatedPage = await createPageWithStorageState(
        browser,
        authenticatedStorageState,
      );
      context = authenticatedPage.context;
      page = authenticatedPage.page;
    },

    afterEach: async (): Promise<void> => {
      await context?.close();
      context = undefined;
      page = undefined;
    },

    getContext: (): BrowserContext => {
      if (!context) {
        throw new Error("Authenticated test context is not initialized");
      }
      return context;
    },

    getPage: (): Page => {
      if (!page) {
        throw new Error("Authenticated test page is not initialized");
      }
      return page;
    },
  };
}
