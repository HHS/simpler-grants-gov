import { axe } from "jest-axe";
import SavedGrants from "src/app/[locale]/saved-grants/page";
import {
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";
import { mockOpportunity } from "src/utils/testing/opportunityMock";
import { render, screen, waitFor } from "tests/react-utils";

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve(mockUseTranslations),
}));

const savedOpportunities = jest.fn().mockReturnValue([]);
const opportunity = jest.fn().mockReturnValue({ data: [] });

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: () => opportunity() as Promise<OpportunityApiResponse>,
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: () =>
    savedOpportunities() as Promise<MinimalOpportunity[]>,
}));

describe("Saved Grants page", () => {
  it("renders intro text for user with no saved grants", async () => {
    const component = await SavedGrants({ params: localeParams });
    render(component);

    const content = screen.getByText("SavedGrants.heading");

    expect(content).toBeInTheDocument();
  });

  it("renders a list of saved grants", async () => {
    savedOpportunities.mockReturnValue([{ opportunity_id: 12345 }]);
    opportunity.mockReturnValue({ data: mockOpportunity });
    const component = await SavedGrants({ params: localeParams });
    render(component);

    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(1);
  });

  it("passes accessibility scan", async () => {
    const component = await SavedGrants({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
