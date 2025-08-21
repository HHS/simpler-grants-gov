import { axe } from "jest-axe";
import SavedOpportunities from "src/app/[locale]/(base)/saved-opportunities/page";
import {
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunity } from "src/utils/testing/fixtures";
import {
  localeParams,
  mockUseTranslations,
  useTranslationsMock,
} from "src/utils/testing/intlMocks";
import { render, screen, waitFor } from "tests/react-utils";

import { ReactNode } from "react";

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children, // this is a dumb workaround for a global wrapper we're using
}));

const savedOpportunities = jest.fn().mockResolvedValue([]);
const opportunity = jest.fn().mockResolvedValue({ data: [] });
const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: () => opportunity() as Promise<OpportunityApiResponse>,
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: () =>
    savedOpportunities() as Promise<MinimalOpportunity[]>,
}));

describe("Saved Opportunities page", () => {
  it("to match snapshot", async () => {
    const component = await SavedOpportunities({ params: localeParams });
    render(component);

    expect(component).toMatchSnapshot();
  });

  it("renders intro text for user with no saved opportunities", async () => {
    const component = await SavedOpportunities({ params: localeParams });
    render(component);

    const content = await screen.findByText("noSavedCTAParagraphOne");

    await waitFor(() => expect(content).toBeInTheDocument());
  });

  it("renders a list of saved opportunities", async () => {
    savedOpportunities.mockResolvedValue([{ opportunity_id: 12345 }]);
    opportunity.mockResolvedValue({ data: mockOpportunity });
    const component = await SavedOpportunities({ params: localeParams });
    render(component);

    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Test Opportunity",
      }),
    ).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    savedOpportunities.mockResolvedValue([{ opportunity_id: 12345 }]);
    opportunity.mockResolvedValue({ data: mockOpportunity });
    const component = await SavedOpportunities({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
