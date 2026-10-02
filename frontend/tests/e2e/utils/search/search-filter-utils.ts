import {
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParamValues } from "tests/e2e/playwrightUtils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  toggleCheckboxGroup,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/searchSpecUtil";

const { baseUrl, targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

export const LOGIN_STATES = ["logged in", "not logged in"] as const;
export type LoginState = (typeof LOGIN_STATES)[number];

const FUNDING_INSTRUMENT_GRANT = {
  "funding-instrument-grant": "grant",
};

const ELIGIBILITY_COUNTY = {
  "eligibility-county_governments": "county_governments",
};

export async function openSearchWithFilterDrawer(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  loginState: LoginState,
): Promise<void> {
  const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

  if (loginState === "logged in") {
    skipNonChromeOnStaging(testInfo);
    await authenticateE2eUser(page, context, isMobile);
  }

  await gotoWithRetry(page, `${baseUrl}/search`, {
    timeout: GOTO_TIMEOUT,
  });

  await waitForSearchResultsInitialLoad(page);
  await ensureFilterDrawerOpen(page);
}

export async function selectAdditionalFilters(page: Page): Promise<void> {
  await ensureAccordionExpanded(page, "Funding instrument");
  await toggleCheckboxGroup(page, FUNDING_INSTRUMENT_GRANT);

  await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
    "grant",
  ]);

  await ensureAccordionExpanded(page, "Eligibility");
  await toggleCheckboxGroup(page, ELIGIBILITY_COUNTY);

  await waitForURLContainsQueryParamValues(page, "eligibility", [
    "county_governments",
  ]);

  await waitForSearchResultsInitialLoad(page);
}

export async function expectAdditionalFiltersCleared(
  page: Page,
): Promise<void> {
  await ensureAccordionExpanded(page, "Funding instrument");

  await expect(
    page.getByRole("checkbox", {
      name: /grant/i,
    }),
  ).not.toBeChecked();

  await ensureAccordionExpanded(page, "Eligibility");

  await expect(
    page.getByRole("checkbox", {
      name: /county governments/i,
    }),
  ).not.toBeChecked();
}
