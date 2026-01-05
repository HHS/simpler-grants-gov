import { screen } from "@testing-library/react";
import { axe } from "jest-axe";

import SavedOpportunities from "./page";
import { renderServerPage } from "tests/utils/page-utils";

import type {
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";

import { messages } from "src/i18n/messages/en";
import { okResponse } from "tests/utils/api";
import {
  makeOpportunityDetail,
  makeMinimalOpportunity,
} from "tests/utils/fixtures/opportunity";

const fetchSavedOpportunitiesMock = jest.fn<Promise<MinimalOpportunity[]>, []>();
const getOpportunityDetailsMock = jest.fn<
  Promise<OpportunityApiResponse>,
  [string]
>();

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: () => fetchSavedOpportunitiesMock(),
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: (id: string) => getOpportunityDetailsMock(id),
}));

jest.mock("src/components/search/SearchResultsListItem", () => {
  return function SearchResultsListItemMock(props: {
    opportunity: {
      opportunity_id: string;
      opportunity_title: string | null;
      opportunity_number: string;
    };
    saved: boolean;
    index: number;
  }) {
    return (
      <div>
        <a href={`/opportunity/${props.opportunity.opportunity_id}`}>
          {props.opportunity.opportunity_title}
        </a>
        <div>{props.opportunity.opportunity_number}</div>
      </div>
    );
  };
});

jest.mock("src/components/Breadcrumbs", () => {
  return function BreadcrumbsMock() {
    return <nav aria-label="Breadcrumb" />;
  };
});

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => {
    if (key === "SavedOpportunities.heading")
      return messages.SavedOpportunities.heading;
    return key;
  },
}));

describe("Saved Opportunities page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSavedOpportunitiesMock.mockResolvedValue([]);
    getOpportunityDetailsMock.mockResolvedValue(
      okResponse(makeOpportunityDetail({ opportunity_id: "12345" })),
    );
  });

  it("renders the heading", async () => {
    await renderServerPage(SavedOpportunities, { locale: "en" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: messages.SavedOpportunities.heading,
      }),
    ).toBeInTheDocument();
  });

  it("shows the empty state CTA and search button when there are no saved opportunities", async () => {
    await renderServerPage(SavedOpportunities, { locale: "en" });

    expect(
      screen.getByText(messages.SavedOpportunities.noSavedCTAParagraphOne),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.SavedOpportunities.noSavedCTAParagraphTwo),
    ).toBeInTheDocument();

    const searchCta = screen.getByRole("link", {
      name: messages.SavedOpportunities.searchButton,
    });
    expect(searchCta).toHaveAttribute("href", "/search");

    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledTimes(1);
    expect(getOpportunityDetailsMock).not.toHaveBeenCalled();
  });

  it("renders a list of saved opportunities when present", async () => {
    fetchSavedOpportunitiesMock.mockResolvedValue([
      makeMinimalOpportunity({ opportunity_id: "12345" }),
    ]);

    getOpportunityDetailsMock.mockResolvedValue(
      okResponse(
        makeOpportunityDetail({
          opportunity_id: "12345",
          opportunity_title: "Test Opportunity",
          opportunity_number: "OPP-12345",
        }),
      ),
    );

    await renderServerPage(SavedOpportunities, { locale: "en" });

    expect(screen.getByRole("link", { name: "Test Opportunity" })).toHaveAttribute(
      "href",
      "/opportunity/12345",
    );
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();

    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledTimes(1);
    expect(getOpportunityDetailsMock).toHaveBeenCalledTimes(1);
    expect(getOpportunityDetailsMock).toHaveBeenCalledWith("12345");
  });

  it("passes accessibility scan in empty state", async () => {
    const { container } = await renderServerPage(SavedOpportunities, {
      locale: "en",
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("fetches and renders multiple saved opportunities", async () => {
    fetchSavedOpportunitiesMock.mockResolvedValue([
      makeMinimalOpportunity({ opportunity_id: "1" }),
      makeMinimalOpportunity({ opportunity_id: "2" }),
    ]);

    getOpportunityDetailsMock
      .mockResolvedValueOnce(
        okResponse(
          makeOpportunityDetail({
            opportunity_id: "1",
            opportunity_title: "Opp One",
            opportunity_number: "OPP-1",
          }),
        ),
      )
      .mockResolvedValueOnce(
        okResponse(
          makeOpportunityDetail({
            opportunity_id: "2",
            opportunity_title: "Opp Two",
            opportunity_number: "OPP-2",
          }),
        ),
      );

    await renderServerPage(SavedOpportunities, { locale: "en" });

    expect(screen.getByRole("link", { name: "Opp One" })).toHaveAttribute(
      "href",
      "/opportunity/1",
    );
    expect(screen.getByRole("link", { name: "Opp Two" })).toHaveAttribute(
      "href",
      "/opportunity/2",
    );

    expect(getOpportunityDetailsMock).toHaveBeenCalledTimes(2);
    expect(getOpportunityDetailsMock).toHaveBeenNthCalledWith(1, "1");
    expect(getOpportunityDetailsMock).toHaveBeenNthCalledWith(2, "2");
  });
});
