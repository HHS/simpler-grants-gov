/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable testing-library/no-node-access */

import { render, screen } from "@testing-library/react";
import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityDescription from "src/components/opportunity/OpportunityDescription";

const splitMarkupMock = jest
  .fn()
  .mockImplementation((content: string, index: number) => ({
    preSplit: content.substring(0, index),
    postSplit: content.substring(index),
  }));

jest.mock("isomorphic-dompurify", () => ({
  sanitize: jest.fn((input: string) => input),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/utils/generalUtils", () => ({
  splitMarkup: (content: string, index: number) =>
    // eslint-disable-next-line
    splitMarkupMock(content, index),
}));

const longDescription =
  "Its young really risk. College call month identify out east. Defense writer ahead trip smile. Picture data area system manager hour none. Doctor pay visit save test. Again feeling little throughout. Improve drug play remain face word somebody. Baby miss may drive treat letter. Laugh message as car position team. Want build last. Model or base within bag manager brother. How still teacher son fish pay until. Debate doctor visit because success. Message will white risk. Follow sell nearly individual family crime particularly understand. Police street federal six really major owner. Should friend minute team material trade special. Example above government usually deal fill few. Kid middle our sometimes appear. Ready share century nor take let. Water sort choice beat design she sport commercial. Nature if natural feel. Yes door cold realize. Receive trade central good realize number woman them. Actually there common order purpose within. Enough trouble develop station almost read. Who attack include company.";

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
} as Summary;

describe("OpportunityDescription", () => {
  it("renders the opportunity description", () => {
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={mockSummaryData}
        nofoPath=""
      />,
    );

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

  it("splits opportunity description after 600 characters if description is longer than 750 characters", () => {
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={{ ...mockSummaryData, summary_description: longDescription }}
        nofoPath=""
      />,
    );

    expect(
      screen.getByText(
        "Its young really risk. College call month identify out east. Defense writer ahead trip smile. Picture data area system manager hour none. Doctor pay visit save test. Again feeling little throughout. Improve drug play remain face word somebody. Baby miss may drive treat letter. Laugh message as car position team. Want build last. Model or base within bag manager brother. How still teacher son fish pay until. Debate doctor visit because success. Message will white risk. Follow sell nearly individual family crime particularly understand. Police street federal six really major owner. Should friend...",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(
        " minute team material trade special. Example above government usually deal fill few. Kid middle our sometimes appear. Ready share century nor take let. Water sort choice beat design she sport commercial. Nature if natural feel. Yes door cold realize. Receive trade central good realize number woman them. Actually there common order purpose within. Enough trouble develop station almost read. Who attack include company.",
      ),
    ).toHaveLength(0);
  });

  it("shows all description if parsed mark up comes out with no content to hide", () => {
    splitMarkupMock.mockImplementation((content: string) => ({
      preSplit: content,
      postSplit: "",
    }));

    render(
      <OpportunityDescription
        opportunityId={1}
        summary={{ ...mockSummaryData, summary_description: longDescription }}
        nofoPath=""
      />,
    );

    expect(
      screen.getByText(
        "Its young really risk. College call month identify out east. Defense writer ahead trip smile. Picture data area system manager hour none. Doctor pay visit save test. Again feeling little throughout. Improve drug play remain face word somebody. Baby miss may drive treat letter. Laugh message as car position team. Want build last. Model or base within bag manager brother. How still teacher son fish pay until. Debate doctor visit because success. Message will white risk. Follow sell nearly individual family crime particularly understand. Police street federal six really major owner. Should friend minute team material trade special. Example above government usually deal fill few. Kid middle our sometimes appear. Ready share century nor take let. Water sort choice beat design she sport commercial. Nature if natural feel. Yes door cold realize. Receive trade central good realize number woman them. Actually there common order purpose within. Enough trouble develop station almost read. Who attack include company.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the eligible applicants with mapped values", () => {
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={mockSummaryData}
        nofoPath=""
      />,
    );

    const eligibleApplicantsHeading = screen.getByText("eligible_applicants");
    expect(eligibleApplicantsHeading).toBeInTheDocument();

    expect(screen.getByText("State governments")).toBeInTheDocument();
    expect(
      screen.getByText("Nonprofits non-higher education with 501(c)(3)"),
    ).toBeInTheDocument();
    expect(screen.getByText("unknown_type")).toBeInTheDocument();
  });

  it("renders additional information on eligibility", () => {
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={mockSummaryData}
        nofoPath=""
      />,
    );

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
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={mockSummaryData}
        nofoPath=""
      />,
    );

    const contactInfoHeading = screen.getByText("contact_info");
    expect(contactInfoHeading).toBeInTheDocument();

    expect(screen.getByText("contact@example.com")).toBeInTheDocument();
    expect(screen.getByText("Contact Email Description")).toBeInTheDocument();

    const mailtoLink = screen.getByRole("link", {
      name: "contact@example.com",
    });
    const agency_email = "contact@example.com";
    expect(mailtoLink).toHaveAttribute("href", `mailto:${agency_email}`);
  });

  it("renders information correctly when null values are present", () => {
    render(
      <OpportunityDescription
        opportunityId={1}
        summary={{
          ...mockSummaryData,
          applicant_types: [],
          applicant_eligibility_description: null,
          agency_contact_description: null,
          agency_email_address: null,
          agency_email_address_description: null,
          summary_description: null,
        }}
        nofoPath=""
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
  });
});
