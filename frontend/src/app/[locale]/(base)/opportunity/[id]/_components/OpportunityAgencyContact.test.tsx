import { render, screen } from "@testing-library/react";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityAgencyContact from "./OpportunityAgencyContact";

const renderContact = (summary: Partial<Summary> = {}) =>
  render(
    <OpportunityAgencyContact
      summary={{ ...mockOpportunityDetail.summary, ...summary }}
    />,
  );

describe("OpportunityAgencyContact", () => {
  it("renders the email and each description in its own paragraph", () => {
    renderContact({
      agency_email_address: "contact@agency.gov",
      agency_email_address_description: "Email the program office",
      agency_contact_description: "<p>Call us weekdays</p>",
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByText("email:").closest("p")).toHaveTextContent(
      "email: contact@agency.gov",
    );
    expect(
      screen.getByRole("link", { name: "contact@agency.gov" }),
    ).toHaveAttribute("href", "mailto:contact@agency.gov");
    expect(screen.getByText("Email the program office").tagName).toBe("P");
    expect(screen.getByText("Call us weekdays").tagName).toBe("P");
    expect(
      screen.queryByText("noAdditionalContactInfo"),
    ).not.toBeInTheDocument();
  });

  it("shows one fallback when both descriptions are missing", () => {
    renderContact({ agency_email_address: "contact@agency.gov" });

    expect(screen.getAllByText("noAdditionalContactInfo")).toHaveLength(1);
  });

  it("does not show the fallback when only one description is provided", () => {
    renderContact({ agency_contact_description: "Call us weekdays" });

    expect(screen.getByText("Call us weekdays")).toBeInTheDocument();
    expect(
      screen.queryByText("noAdditionalContactInfo"),
    ).not.toBeInTheDocument();
  });

  it("omits the email paragraph when there is no email address", () => {
    renderContact({ agency_email_address: null });

    expect(screen.queryByText("email:")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
