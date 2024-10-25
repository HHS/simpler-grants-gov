/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable testing-library/no-node-access */

import { render, screen } from "@testing-library/react";
import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityDescription from "src/components/opportunity/OpportunityDescription";

jest.mock("isomorphic-dompurify", () => ({
  sanitize: jest.fn((input: string) => input),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const mockSummaryData: Summary = {
  summary_description: "<p>Summary Description</p>",
  applicant_types: [
    "state_governments",
    "nonprofits_non_higher_education_with_501c3",
    "unknown_type",
  ],
  applicant_eligibility_description: "<p>Eligibility Description</p>",
  agency_contact_description: "<p>Contact Description</p>",
  agency_email_address: "contact@example.com",
  agency_email_address_description: "Contact Email Description",
  agency_phone_number: "123-456-7890",
} as Summary;

describe("OpportunityDescription", () => {
  it("renders the opportunity description", () => {
    render(<OpportunityDescription summary={mockSummaryData} />);

    const descriptionHeading = screen.getByText("description");
    expect(descriptionHeading).toBeInTheDocument();

    const sanitizedSummaryDescription = DOMPurify.sanitize(
      "<p>Summary Description</p>",
    );
    expect(screen.getByText("Summary Description")).toBeInTheDocument();
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(
      sanitizedSummaryDescription,
    );
  });

  it("renders the eligible applicants with mapped values", () => {
    render(<OpportunityDescription summary={mockSummaryData} />);

    const eligibleApplicantsHeading = screen.getByText("eligible_applicants");
    expect(eligibleApplicantsHeading).toBeInTheDocument();

    expect(screen.getByText("State governments")).toBeInTheDocument();
    expect(
      screen.getByText("Nonprofits non-higher education with 501(c)(3)"),
    ).toBeInTheDocument();
    expect(screen.getByText("unknown_type")).toBeInTheDocument();
  });

  it("renders additional information on eligibility", () => {
    render(<OpportunityDescription summary={mockSummaryData} />);

    const additionalInfoHeading = screen.getByText("additional_info");
    expect(additionalInfoHeading).toBeInTheDocument();

    const sanitizedEligibilityDescription = DOMPurify.sanitize(
      mockSummaryData.applicant_eligibility_description
        ? mockSummaryData.applicant_eligibility_description
        : "",
    );
    expect(screen.getByText("Eligibility Description")).toBeInTheDocument();
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(
      sanitizedEligibilityDescription,
    );
  });

  it("renders agency contact information", () => {
    render(<OpportunityDescription summary={mockSummaryData} />);

    const contactInfoHeading = screen.getByText("contact_info");
    expect(contactInfoHeading).toBeInTheDocument();

    expect(screen.getByText("contact@example.com")).toBeInTheDocument();
    expect(screen.getByText("Contact Email Description")).toBeInTheDocument();
    expect(screen.getByText("123-456-7890")).toBeInTheDocument();

    const mailtoLink = screen.getByRole("link", {
      name: "contact@example.com",
    });
    const agency_email = "contact@example.com";
    expect(mailtoLink).toHaveAttribute("href", `mailto:${agency_email}`);

    const telLink = screen.getByRole("link", {
      name: "123-456-7890",
    });
    const number = "1234567890";
    expect(telLink).toHaveAttribute("href", `tel:${number}`);
  });

  it("renders information correctly when null values are present", () => {
    render(
      <OpportunityDescription
        summary={{
          ...mockSummaryData,
          applicant_types: [],
          applicant_eligibility_description: null,
          agency_contact_description: null,
          agency_email_address: null,
          agency_email_address_description: null,
          agency_phone_number: null,
          summary_description: null,
        }}
      />,
    );

    const contactInfoHeading = screen.getByText("summary");
    expect(contactInfoHeading).toBeInTheDocument();
    expect(contactInfoHeading.nextElementSibling).toHaveTextContent("--");

    const descriptionHeading = screen.getByText("description");
    expect(descriptionHeading).toBeInTheDocument();
    expect(descriptionHeading.nextElementSibling).toHaveTextContent("--");

    const applicantsHeading = screen.getByText("eligible_applicants");
    expect(applicantsHeading).toBeInTheDocument();
    expect(applicantsHeading.nextSibling).toHaveTextContent("--");

    const emailHeading = screen.getByText("email");
    expect(emailHeading).toBeInTheDocument();
    expect(emailHeading.nextElementSibling).toHaveTextContent("--");

    const telephoneHeading = screen.getByText("telephone");
    expect(telephoneHeading).toBeInTheDocument();
    expect(telephoneHeading.nextElementSibling).toHaveTextContent("--");
  });
});
