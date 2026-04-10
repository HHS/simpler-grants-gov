import { render, screen } from "@testing-library/react";

import OpportunityEditForm from "./OpportunityEditForm";
import { OpportunityEditFormValues } from "./opportunityEditFormConfig";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

const initialValues: OpportunityEditFormValues = {
  opportunityNumber: "ABC-123",
  title: "Test opportunity",
  awardSelectionMethod: "discretionary",
  awardSelectionMethodExplanation: "",
  description: "Summary text",
  fundingType: ["grant"],
  costSharing: false,
  publishDate: "2026-03-11",
  closeDate: "2026-04-11",
  closeDateExplanation: "",
  fundingCategories: ["education"],
  fundingCategoryExplanation: "",
  expectedNumberOfAwards: "3",
  estimatedTotalProgramFunding: "500000",
  awardMinimum: "1000",
  awardMaximum: "10000",
  eligibleApplicants: ["individuals"],
  additionalEligibilityInfo: "",
  additionalInfoUrl: "https://example.com",
  additionalInfoUrlText: "More information",
  grantorContactDetails: "Grants team",
  contactEmail: "grants@example.com",
  contactEmailText: "Email the grants team",
};

const testOpportunityKeyInformation = {
  title: "Test opportunity",
  agency: "Test agency",
  assistanceListings: "12.345",
  opportunityNumber: "ABC-123",
  opportunityStage: "Forecasted",
  awardSelectionMethod: "discretionary",
  awardSelectionMethodExplanation: "Standard review",
};

const renderOpportunityEditForm = (
  props: Partial<React.ComponentProps<typeof OpportunityEditForm>> = {},
) =>
  render(
    <OpportunityEditForm
      opportunityId="opportunity-123"
      opportunitySummaryId="summary-456"
      initialValues={initialValues}
      isDraft
      opportunityKeyInformation={testOpportunityKeyInformation}
      {...props}
    />,
  );

describe("OpportunityEditForm", () => {
  it("does not render the old scaffold information alert", () => {
    renderOpportunityEditForm();

    expect(
      screen.queryByText(
        "This page is a frontend scaffold for editing draft opportunity details. Save wiring will be added when the grantor update API contract is ready.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders enum-backed controls for the edit form", () => {
    renderOpportunityEditForm();

    expect(
      screen.getByRole("combobox", { name: /labels\.fundingType/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /labels\.category/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /yes/i })).toBeInTheDocument();
    // Verify checkbox value attribute so the correct enum string is submitted with the form
    // (checkboxes without a value= prop default to "on" and fail API validation)
    // .toHaveValue() cannot be used here: for unchecked checkboxes it always returns null
    // regardless of the value attribute, so .toHaveAttribute() is required instead.
    // eslint-disable-next-line jest-dom/prefer-to-have-value
    expect(
      screen.getByRole("checkbox", {
        name: /for-profit organizations other than small businesses/i,
      }),
    ).toHaveAttribute(
      "value",
      "for_profit_organizations_other_than_small_businesses",
    );
  });

  it("renders hidden fields for save context", () => {
    renderOpportunityEditForm({ isForecast: true });

    expect(screen.getByDisplayValue("opportunity-123")).toHaveAttribute(
      "name",
      "opportunityId",
    );
    expect(screen.getByDisplayValue("summary-456")).toHaveAttribute(
      "name",
      "opportunitySummaryId",
    );
    expect(screen.getByTestId("isForecast-input")).toHaveValue("true");
    expect(screen.getByDisplayValue("Test opportunity")).toHaveAttribute(
      "name",
      "title",
    );
    expect(screen.getByDisplayValue("discretionary")).toHaveAttribute(
      "name",
      "awardSelectionMethod",
    );
  });

  it("shows the non-draft warning", () => {
    renderOpportunityEditForm({ isDraft: false });

    expect(screen.getByText("content.draftOnlyWarning")).toBeInTheDocument();
  });
});
