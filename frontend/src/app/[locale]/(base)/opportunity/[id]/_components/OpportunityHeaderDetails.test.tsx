import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { messages } from "src/i18n/messages/en";
import {
  OpportunityDetail,
  OpportunityStatus,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityHeaderDetails from "./OpportunityHeaderDetails";

// note that next-intl is mocked globally, translations render as their keys

const baseOpportunity = {
  opportunity_id: "63588df8-f2d1-44ed-a201-5804abba696a",
  legacy_opportunity_id: 1,
  opportunity_title: "Test Opportunity",
  agency_name: "Test Agency",
  opportunity_status: "posted",
  opportunity_assistance_listings: [
    {
      assistance_listing_number: "15.808",
      program_title: "Geological Survey Research",
    },
  ],
  updated_at: "2024-04-29T10:00:00Z",
} as OpportunityDetail;

const renderDetails = (overrides: Partial<OpportunityDetail> = {}) =>
  render(
    <OpportunityHeaderDetails
      opportunityData={{ ...baseOpportunity, ...overrides }}
    />,
  );

describe("OpportunityHeaderDetails", () => {
  it("has no accessibility violations", async () => {
    const { container } = renderDetails();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the agency, falling back when it is missing", () => {
    const { unmount } = renderDetails();
    expect(screen.getByText("agency Test Agency")).toBeInTheDocument();
    unmount();

    renderDetails({ agency_name: null });
    expect(screen.getByText("agency --")).toBeInTheDocument();
  });

  describe("assistance listings", () => {
    it("links to assistance listings in a new tab", () => {
      renderDetails();
      const link = screen.getByRole("link", { name: "assistanceListings" });
      expect(link).toHaveAttribute(
        "href",
        "https://sam.gov/assistance-listings",
      );
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("shows fallback text when there are no assistance listings", () => {
      renderDetails({ opportunity_assistance_listings: [] });
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent("assistanceListingsUnavailable");
    });

    it("shows a single assistance listing", () => {
      renderDetails();
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent(
        "15.808 -- Geological Survey Research",
      );
    });

    it("shows every assistance listing when there are several", () => {
      renderDetails({
        opportunity_assistance_listings: [
          { assistance_listing_number: "15.808", program_title: "First" },
          { assistance_listing_number: "93.859", program_title: "Second" },
          { assistance_listing_number: "47.075", program_title: "Third" },
        ],
      });
      const items = screen.getAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual([
        "15.808 -- First",
        "93.859 -- Second",
        "47.075 -- Third",
      ]);
    });
  });

  describe("status", () => {
    it.each<OpportunityStatus>(["forecasted", "posted", "closed", "archived"])(
      "shows %s status, with opportunity context for screen readers",
      (status) => {
        renderDetails({ opportunity_status: status });
        const tag = screen.getByTestId("opportunity-header-status");
        // the single visible word is hidden from assistive technology in favor of the full context
        expect(within(tag).getByText(`status.${status}`)).toHaveAttribute(
          "aria-hidden",
          "true",
        );
        expect(within(tag).getByText(`statusAccessible.${status}`)).toHaveClass(
          "usa-sr-only",
        );
      },
    );

    it("describes each status as the opportunity's status", () => {
      expect(messages.OpportunityListing.header.statusAccessible).toEqual({
        posted: "Open opportunity",
        forecasted: "Forecasted opportunity",
        closed: "Closed opportunity",
        archived: "Archived opportunity",
      });
    });

    it("shows no status when the opportunity has none, for example package only", () => {
      // the API returns a null status when there is no current summary, which the type doesn't reflect
      renderDetails({
        opportunity_status: null as unknown as OpportunityStatus,
      });
      expect(
        screen.queryByTestId("opportunity-header-status"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("lastUpdated Apr 29, 2024")).toBeInTheDocument();
    });
  });

  it("renders the last updated date, falling back when it is missing", () => {
    const { unmount } = renderDetails();
    expect(screen.getByText(/lastUpdated Apr 29, 2024/)).toBeInTheDocument();
    unmount();

    renderDetails({ updated_at: "" });
    expect(screen.getByText(/lastUpdated --/)).toBeInTheDocument();
  });
});
