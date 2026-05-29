import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { OpportunityEditFormValues } from "src/utils/opportunityEditFormConfig";

import OpportunityEditHeader from "./OpportunityEditHeader";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/actions",
  () => ({
    submitOpportunityAction: jest.fn(),
  }),
);

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const initialValues: OpportunityEditFormValues = {
  opportunityNumber: "ABC-123",
  title: "Test opportunity",
  awardSelectionMethod: "discretionary",
  awardSelectionMethodExplanation: "",
  description: "Summary text",
  fundingType: "grant",
  costSharing: false,
  publishDate: "2026-03-11",
  closeDate: "2026-04-11",
  closeDateExplanation: "",
  fundingCategories: "education",
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

const emptyInitialValues: OpportunityEditFormValues = {
  ...initialValues,
  publishDate: "",
  fundingType: "",
  fundingCategories: "",
  eligibleApplicants: [],
};

const renderHeader = (
  props: Partial<React.ComponentProps<typeof OpportunityEditHeader>> = {},
) =>
  render(
    <OpportunityEditHeader
      initialValues={initialValues}
      previewLabel="Preview"
      publishLabel="Publish"
      {...props}
    />,
  );

describe("OpportunityEditHeader", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([{}, jest.fn(), false]);
  });

  it("passes accessibility scan", async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("enables the publish button when all required fields are populated", () => {
    renderHeader();

    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

  it("disables the publish button when required fields are missing", () => {
    renderHeader({ initialValues: emptyInitialValues });

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("disables the publish button while submitting", () => {
    mockUseActionState.mockReturnValue([{}, jest.fn(), true]);

    renderHeader();

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("renders an error alert when submitState has an errorMessage", () => {
    mockUseActionState.mockReturnValue([
      { errorMessage: "forbidden" },
      jest.fn(),
      false,
    ]);

    renderHeader();

    // USWDS Alert renders a heading and body, not a role="alert" element.
    expect(
      screen.getByRole("heading", { name: "errorHeading" }), // useTranslations mock returns the key
    ).toBeInTheDocument();
    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });

  it("does not render an error alert when there is no errorMessage", () => {
    renderHeader();

    expect(
      screen.queryByRole("heading", { name: "errorHeading" }),
    ).not.toBeInTheDocument();
  });
});
