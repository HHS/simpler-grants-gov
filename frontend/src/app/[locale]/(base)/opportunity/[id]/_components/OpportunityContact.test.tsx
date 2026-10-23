import { render, screen } from "@testing-library/react";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";

import OpportunityContact from "./OpportunityContact";

jest.mock("isomorphic-dompurify", () => ({
  sanitize: jest.fn((input: string) => input),
}));

const mockSummaryData = {
  agency_contact_description: "<p>Contact Description</p>",
  agency_email_address: "contact@example.com",
  agency_email_address_description: "Contact Email Description",
} as Summary;

describe("OpportunityContact", () => {
  it("renders the heading, labelled email link, and both descriptions", () => {
    render(<OpportunityContact summary={mockSummaryData} />);

    expect(screen.getByText("contactInfo")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();

    const mailtoLink = screen.getByRole("link", {
      name: "contact@example.com",
    });
    expect(mailtoLink).toHaveAttribute("href", "mailto:contact@example.com");

    expect(screen.getByText("Contact Email Description")).toBeInTheDocument();
    expect(screen.getByText("Contact Description")).toBeInTheDocument();
    expect(screen.queryByText("noContactInfo")).not.toBeInTheDocument();
  });

  it("shows the fallback message when neither description exists", () => {
    render(
      <OpportunityContact
        summary={{
          ...mockSummaryData,
          agency_contact_description: null,
          agency_email_address_description: null,
        }}
      />,
    );

    expect(screen.getByText("noContactInfo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "contact@example.com" }),
    ).toBeInTheDocument();
  });

  it("does not show the fallback when only one description exists", () => {
    render(
      <OpportunityContact
        summary={{ ...mockSummaryData, agency_contact_description: null }}
      />,
    );

    expect(screen.getByText("Contact Email Description")).toBeInTheDocument();
    expect(screen.queryByText("noContactInfo")).not.toBeInTheDocument();
  });

  it("renders a placeholder when there is no email address", () => {
    render(
      <OpportunityContact
        summary={{ ...mockSummaryData, agency_email_address: null }}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("notSpecified")).toBeInTheDocument();
  });
});
