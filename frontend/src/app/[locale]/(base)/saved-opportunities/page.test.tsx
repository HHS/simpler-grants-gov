import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { messages } from "src/i18n/messages/en";
import type {
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { render } from "tests/react-utils";
import { okResponse } from "tests/utils/api";
import {
  makeMinimalOpportunity,
  makeOpportunityDetail,
} from "tests/utils/fixtures/opportunity";

import React from "react";

import SavedOpportunities from "./page";

const fetchSavedOpportunitiesMock: jest.MockedFunction<
  (status?: string) => Promise<MinimalOpportunity[]>
> = jest.fn();

const getOpportunityDetailsMock: jest.MockedFunction<
  (id: string) => Promise<OpportunityApiResponse>
> = jest.fn();

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: (status?: string) =>
    fetchSavedOpportunitiesMock(status),
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/saved-opportunities",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock(
  "src/components/saved-opportunities/SavedOpportunityStatusFilter",
  () => {
    return function SavedOpportunityStatusFilterMock() {
      return <div data-testid="status-filter" />;
    };
  },
);

jest.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) => {
      if (key === "SavedOpportunities.heading") {
        return messages.SavedOpportunities.heading;
      }
      if (key === "SavedOpportunities.noSavedCTAParagraphOne") {
        return messages.SavedOpportunities.noSavedCTAParagraphOne;
      }
      if (key === "SavedOpportunities.noSavedCTAParagraphTwo") {
        return messages.SavedOpportunities.noSavedCTAParagraphTwo;
      }
      if (key === "SavedOpportunities.searchButton") {
        return messages.SavedOpportunities.searchButton;
      }
      if (key === "SavedOpportunities.noMatchingStatus") {
        return messages.SavedOpportunities.noMatchingStatus;
      }
      return key;
    }),
  setRequestLocale: jest.fn(),
}));

type SavedOpportunitiesTestProps = {
  locale?: string;
  status?: string;
};

async function renderSavedOpportunitiesPage({
  locale = "en",
  status,
}: SavedOpportunitiesTestProps = {}) {
  const ui = await SavedOpportunities({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(status ? { status } : {}),
  });

  return render(ui);
}

describe("Saved Opportunities page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSavedOpportunitiesMock.mockResolvedValue([]);
    getOpportunityDetailsMock.mockResolvedValue(
      okResponse(makeOpportunityDetail({ opportunity_id: "12345" })),
    );
  });

  it("renders the heading", async () => {
    await renderSavedOpportunitiesPage({ locale: "en" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: messages.SavedOpportunities.heading,
      }),
    ).toBeInTheDocument();
  });

  it("shows the empty state CTA and search button when there are no saved opportunities", async () => {
    await renderSavedOpportunitiesPage({ locale: "en" });

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
    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledWith(undefined);
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

    await renderSavedOpportunitiesPage({ locale: "en" });

    expect(
      screen.getByRole("link", { name: "Test Opportunity" }),
    ).toHaveAttribute("href", "/opportunity/12345");
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();

    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledTimes(1);
    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledWith(undefined);
    expect(getOpportunityDetailsMock).toHaveBeenCalledTimes(1);
    expect(getOpportunityDetailsMock).toHaveBeenCalledWith("12345");
  });

  it("passes accessibility scan in empty state", async () => {
    const { container } = await renderSavedOpportunitiesPage({ locale: "en" });
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

    await renderSavedOpportunitiesPage({ locale: "en" });

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

  it("passes status to fetchSavedOpportunities when provided", async () => {
    await renderSavedOpportunitiesPage({ locale: "en", status: "active" });

    expect(fetchSavedOpportunitiesMock).toHaveBeenCalledTimes(2);
    expect(fetchSavedOpportunitiesMock).toHaveBeenNthCalledWith(1, "active");
    expect(fetchSavedOpportunitiesMock).toHaveBeenNthCalledWith(2, undefined);
  });
});
