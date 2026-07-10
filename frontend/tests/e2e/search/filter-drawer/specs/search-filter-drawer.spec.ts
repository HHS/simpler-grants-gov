/**
 * @featureArea Search
 * @feature Search Filter Result Updates
 * @description Validates that applying filter(s) updates the result count and that the applied filter values are reflected in the URL query params.
 */

import { expect, test } from "@playwright/test";
import { waitForURLContainsQueryParamValues } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  getFirstNonNumericAgencyCheckboxId,
  getNumberOfOpportunitySearchResults,
  toggleCheckboxGroup,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION, FULL_REGRESSION } =
  VALID_TAGS;

test.describe("Search page - filter selection updates results", () => {
  test(
    "should update result count and URL when a single filter is applied",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto("/search");
      await waitForSearchResultsInitialLoad(page);

      const initialCount = await getNumberOfOpportunitySearchResults(page);

      await ensureFilterDrawerOpen(page);
      await ensureAccordionExpanded(page, "Funding instrument");

      const fundingInstrumentCheckboxes = {
        "funding-instrument-grant": "grant",
      };
      await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);

      // URL reflects the applied filter
      await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
        "grant",
      ]);

      // Result count reflects the filter
      await waitForSearchResultsInitialLoad(page);
      const updatedCount = await getNumberOfOpportunitySearchResults(page);
      expect(updatedCount).toBeLessThanOrEqual(initialCount);
    },
  );

  test(
    "should update result count and URL when 3-4 filters are applied",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(180_000);

      await page.goto("/search");
      await waitForSearchResultsInitialLoad(page);

      const initialCount = await getNumberOfOpportunitySearchResults(page);

      await ensureFilterDrawerOpen(page);

      await ensureAccordionExpanded(page, "Funding instrument");
      await toggleCheckboxGroup(page, { "funding-instrument-grant": "grant" });
      await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
        "grant",
      ]);
      await waitForSearchResultsInitialLoad(page);

      await ensureAccordionExpanded(page, "Eligibility");
      await toggleCheckboxGroup(page, {
        "eligibility-county_governments": "county_governments",
      });
      await waitForURLContainsQueryParamValues(page, "eligibility", [
        "county_governments",
      ]);
      await waitForSearchResultsInitialLoad(page);

      await ensureAccordionExpanded(page, "Category");
      await toggleCheckboxGroup(page, {
        "category-agriculture": "agriculture",
      });
      await waitForURLContainsQueryParamValues(page, "category", [
        "agriculture",
      ]);
      await waitForSearchResultsInitialLoad(page);

      await waitForFilterOptions(page, "agency");
      const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
      expect(agencyId).toBeTruthy();
      if (!agencyId) {
        throw new Error("Could not find an available agency checkbox");
      }
      await toggleCheckboxGroup(page, { [agencyId]: agencyId });
      await waitForURLContainsQueryParamValues(page, "agency", [agencyId]);
      await waitForSearchResultsInitialLoad(page);

      const updatedCount = await getNumberOfOpportunitySearchResults(page);
      expect(updatedCount).toBeLessThanOrEqual(initialCount);
    },
  );
});
