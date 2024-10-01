/* eslint-disable @typescript-eslint/unbound-method */
import { render, screen } from "@testing-library/react";
import DOMPurify from "isomorphic-dompurify";
import {
  Opportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import OpportunityDescription from "src/components/opportunity/OpportunityDescription";

jest.mock("isomorphic-dompurify", () => ({
  sanitize: jest.fn((input: string) => input),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Mock "useTranslations"
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      description: "Description",
      eligible_applicants: "Eligible Applicants",
      additional_info: "Additional Information on eligibility",
      contact_info: "Grantor contact information",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: Opportunity = {
  summary: {
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
  } as Summary,
} as Opportunity;

describe("OpportunityDescription", () => {
  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue((key: string) => key);
  });

  it("renders the opportunity description", () => {
    render(<OpportunityDescription opportunityData={mockOpportunityData} />);

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
    render(<OpportunityDescription opportunityData={mockOpportunityData} />);

    const eligibleApplicantsHeading = screen.getByText("eligible_applicants");
    expect(eligibleApplicantsHeading).toBeInTheDocument();

    expect(screen.getByText("State governments")).toBeInTheDocument();
    expect(
      screen.getByText("Nonprofits non-higher education with 501(c)(3)"),
    ).toBeInTheDocument();
    expect(screen.getByText("unknown_type")).toBeInTheDocument();
  });

  it("renders additional information on eligibility", () => {
    render(<OpportunityDescription opportunityData={mockOpportunityData} />);

    const additionalInfoHeading = screen.getByText("additional_info");
    expect(additionalInfoHeading).toBeInTheDocument();

    const sanitizedEligibilityDescription = DOMPurify.sanitize(
      mockOpportunityData.summary.applicant_eligibility_description
        ? mockOpportunityData.summary.applicant_eligibility_description
        : "",
    );
    expect(screen.getByText("Eligibility Description")).toBeInTheDocument();
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(
      sanitizedEligibilityDescription,
    );
  });

  it("renders agency contact information", () => {
    render(<OpportunityDescription opportunityData={mockOpportunityData} />);

    const contactInfoHeading = screen.getByText("contact_info");
    expect(contactInfoHeading).toBeInTheDocument();

    expect(screen.getByText("contact@example.com")).toBeInTheDocument();
    expect(screen.getByText("Contact Email Description")).toBeInTheDocument();
    expect(screen.getByText("123-456-7890")).toBeInTheDocument();

    const mailtoLink = screen.getByRole("link", {
      name: "Contact Email Description",
    });
    const agency_email = "contact@example.com";
    expect(mailtoLink).toHaveAttribute("href", `mailto:${agency_email}`);

    const telLink = screen.getByRole("link", {
      name: mockOpportunityData.summary.agency_phone_number
        ? mockOpportunityData.summary.agency_phone_number
        : "",
    });
    const number = mockOpportunityData.summary.agency_phone_number
      ? mockOpportunityData.summary.agency_phone_number.replace(/-/g, "")
      : "";
    expect(telLink).toHaveAttribute("href", `tel:${number}`);
  });
});
