import { expect, test } from "@playwright/test";

import { PageProps } from "../utils";

test.describe("Opportunity listing page", () => {
  test.beforeEach(async ({ page }: PageProps) => {
    // Navigate to the search page with the feature flag set
    await page.goto(`/opportunity/${opportunityId}`);
  });

  test("displays all the expected sections", async ({ page }, { project }) => {
    const initialNumberOfOpportunityResults =
      await getNumberOfOpportunitySearchResults(page);

    // check all 4 boxes
    const statusCheckboxes = {
      "status-forecasted": "forecasted",
      "status-posted": "posted",
      "status-closed": "closed",
      "status-archived": "archived",
    };

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    await toggleCheckboxes(page, statusCheckboxes, "status");

    const updatedNumberOfOpportunityResults =
      await getNumberOfOpportunitySearchResults(page);

    expect(initialNumberOfOpportunityResults).toBe(
      updatedNumberOfOpportunityResults,
    );
  });
});
