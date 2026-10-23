import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BaseOpportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityContact from "./OpportunityContact";
import OpportunityHistory from "./OpportunityHistory";
import OpportunityLink from "./OpportunityLink";

// note that next-intl is mocked globally, translations render as their keys

const summary = {
  version_number: 1,
  post_date: null,
  archive_date: null,
  agency_email_address: "contact@example.com",
  agency_email_address_description: "Email us",
  agency_contact_description: null,
  additional_info_url: "https://example.com/more",
  additional_info_url_description: "More information",
} as Summary;

// mirrors the order of the opportunity page: the side column comes first in the
// document, then the main column, so tabbing follows the mobile layout
describe("opportunity details tab order", () => {
  it("moves focus through the links in document order", async () => {
    render(
      <>
        <OpportunityHistory
          summary={summary}
          status="posted"
          legacyOpportunityId={1}
        />
        <OpportunityContact summary={summary} />
        <OpportunityLink opportunityData={{ summary } as BaseOpportunity} />
      </>,
    );

    const expectedOrder = [
      screen.getByRole("link", { name: "versionHistory" }),
      screen.getByRole("link", { name: "contact@example.com" }),
      screen.getByRole("link", { name: "More information" }),
    ];

    for (const link of expectedOrder) {
      await userEvent.tab();
      expect(link).toHaveFocus();
    }
  });

  it("opens the external links in a new tab without leaking the opener", () => {
    render(
      <>
        <OpportunityHistory
          summary={summary}
          status="posted"
          legacyOpportunityId={1}
        />
        <OpportunityLink opportunityData={{ summary } as BaseOpportunity} />
      </>,
    );

    [
      screen.getByRole("link", { name: "versionHistory" }),
      screen.getByRole("link", { name: "More information" }),
    ].forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
