import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { OpportunityEditFormValues } from "src/utils/opportunityEditFormConfig";

import OpportunityEditForm from "./OpportunityEditForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/actions",
  () => ({
    opportunityEditFormAction: jest.fn(),
  }),
);

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: jest.fn(),
  }),
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

const renderOpportunityEditForm = (
  props: Partial<React.ComponentProps<typeof OpportunityEditForm>> = {},
) =>
  render(
    <OpportunityEditForm
      opportunityId="opportunity-123"
      opportunitySummaryId="summary-456"
      initialValues={initialValues}
      isDraft
      {...props}
    />,
  );

// ─── Rendering ───────────────────────────────────────────────────────────────
// Verifies static structure: enum-backed controls, hidden fields, and
// the edit-lock warning when isDraft=false.
describe("OpportunityEditForm — rendering", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    // Verify checkbox value attribute so the correct enum string is submitted with the form.
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

  it("shows the non-draft warning when isDraft is false", () => {
    renderOpportunityEditForm({ isDraft: false });

    expect(screen.getByText("content.draftOnlyWarning")).toBeInTheDocument();
  });

  it("disables character-count fields when isDraft is false", () => {
    renderOpportunityEditForm({ isDraft: false });

    expect(
      screen.getByRole("textbox", { name: /labels\.description/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: /labels\.grantorContactDetails/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "labels.additionalInfoUrl" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "labels.additionalInfoUrlText" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "labels.contactEmail" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "labels.contactEmailText" }),
    ).toBeDisabled();
  });

  it("disables fundingCategoryExplanation when isDraft is false and fundingCategories is 'other'", () => {
    renderOpportunityEditForm({
      isDraft: false,
      initialValues: { ...initialValues, fundingCategories: "other" },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.fundingCategoryExplanation/i,
      }),
    ).toBeDisabled();
  });

  it("disables additionalEligibilityInfo when isDraft is false and eligibleApplicants includes 'other'", () => {
    renderOpportunityEditForm({
      isDraft: false,
      initialValues: { ...initialValues, eligibleApplicants: ["other"] },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.additionalEligibilityInfo/i,
      }),
    ).toBeDisabled();
  });

  it("pre-checks eligibility checkboxes from initialValues", () => {
    renderOpportunityEditForm();

    // initialValues.eligibleApplicants includes "individuals" - verify it renders checked
    const individualsCheckbox = screen.getByRole("checkbox", {
      name: /individuals/i,
    });
    expect(individualsCheckbox).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderOpportunityEditForm();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Alert banners ────────────────────────────────────────────────────────────
// Covers the four banner states: newly-created success, save success, save error,
// and field-level validation summary.
describe("OpportunityEditForm — alert banners", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows the error alert when formState.errorMessage is set", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {}, errorMessage: "Save failed" },
      jest.fn(),
      false,
    ]);

    renderOpportunityEditForm();

    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("shows the success alert when formState.successMessage is set", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {}, successMessage: "Changes saved" },
      jest.fn(),
      false,
    ]);

    renderOpportunityEditForm();

    expect(screen.getByText("Changes saved")).toBeInTheDocument();
    expect(screen.getByText("content.alerts.successBody")).toBeInTheDocument();
  });

  it("shows the validation errors alert when validationErrors has entries", () => {
    mockUseActionState.mockReturnValue([
      {
        validationErrors: {
          fundingType: ["Funding type is required"],
          closeDate: ["Close date must be a valid date"],
        },
      },
      jest.fn(),
      false,
    ]);

    renderOpportunityEditForm();

    expect(
      screen.getByText("content.alerts.validationErrorHeading"),
    ).toBeInTheDocument();
    // Each error appears both in the summary alert and as an inline field error
    expect(screen.getAllByText("Funding type is required")).toHaveLength(2);
    expect(screen.getAllByText("Close date must be a valid date")).toHaveLength(
      2,
    );
  });

  it("does not show validation errors alert when validationErrors is empty", () => {
    renderOpportunityEditForm();

    expect(
      screen.queryByText("content.alerts.validationWarningHeading"),
    ).not.toBeInTheDocument();
  });
});

// ─── Conditional fields ───────────────────────────────────────────────────────
// Three sections are conditionally rendered based on form state:
// fundingCategoryExplanation, closeDateExplanation, additionalEligibilityInfo.
describe("OpportunityEditForm — conditional fields", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows the funding category explanation textarea when fundingCategories is 'other'", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, fundingCategories: "other" },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.fundingCategoryExplanation/i,
      }),
    ).toBeInTheDocument();
  });

  it("hides the funding category explanation textarea when fundingCategories is not 'other'", () => {
    renderOpportunityEditForm();

    expect(
      screen.queryByRole("textbox", {
        name: /labels\.fundingCategoryExplanation/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the close date explanation textarea when closeDate is empty", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, closeDate: "" },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.closeDateExplanation/i,
      }),
    ).toBeInTheDocument();
  });

  it("hides the close date explanation textarea when closeDate has a value", () => {
    renderOpportunityEditForm();

    expect(
      screen.queryByRole("textbox", {
        name: /labels\.closeDateExplanation/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows additional eligibility info textarea when 'other' is in eligibleApplicants", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, eligibleApplicants: ["other"] },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.additionalEligibilityInfo/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows additional eligibility info textarea when 'unrestricted' is in eligibleApplicants", () => {
    renderOpportunityEditForm({
      initialValues: {
        ...initialValues,
        eligibleApplicants: ["unrestricted"],
      },
    });

    expect(
      screen.getByRole("textbox", {
        name: /labels\.additionalEligibilityInfo/i,
      }),
    ).toBeInTheDocument();
  });

  it("hides additional eligibility info textarea when neither 'other' nor 'unrestricted' is selected", () => {
    renderOpportunityEditForm();

    expect(
      screen.queryByRole("textbox", {
        name: /labels\.additionalEligibilityInfo/i,
      }),
    ).not.toBeInTheDocument();
  });
});

// ─── Eligibility checkboxes ───────────────────────────────────────────────────
// Confirms initial checked state and that toggling a checkbox updates state correctly.
describe("OpportunityEditForm — eligibility checkboxes", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders eligibility checkboxes as checked when the value is in eligibleApplicants", () => {
    renderOpportunityEditForm({
      initialValues: {
        ...initialValues,
        eligibleApplicants: [
          "for_profit_organizations_other_than_small_businesses",
        ],
      },
    });

    expect(
      screen.getByRole("checkbox", {
        name: /for-profit organizations other than small businesses/i,
      }),
    ).toBeChecked();
  });

  it("toggles an eligibility checkbox on then off", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, eligibleApplicants: [] },
    });

    const checkbox = screen.getByRole("checkbox", {
      name: /for-profit organizations other than small businesses/i,
    });

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("clicking one checkbox from each eligibility group updates state independently", () => {
    // Exercises the onToggle lambda in all five EligibilityCheckboxGroup instances
    renderOpportunityEditForm({
      initialValues: { ...initialValues, eligibleApplicants: [] },
    });

    // education group
    fireEvent.click(
      screen.getByRole("checkbox", { name: /independent school districts/i }),
    );
    // government group
    fireEvent.click(
      screen.getByRole("checkbox", { name: /state governments/i }),
    );
    // nonprofit group
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /other native american tribal organizations/i,
      }),
    );
    // misc group
    fireEvent.click(screen.getByRole("checkbox", { name: /^individuals$/i }));

    expect(
      screen.getByRole("checkbox", { name: /independent school districts/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /state governments/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: /other native american tribal organizations/i,
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /^individuals$/i }),
    ).toBeChecked();
  });
});

// ─── Save state ───────────────────────────────────────────────────────────────
// When a save creates a new summary record, the returned ID is synced into
// the hidden opportunitySummaryId input so subsequent saves target the correct record.
describe("OpportunityEditForm — save state", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("updates the opportunitySummaryId hidden field when formState.newOpportunitySummaryId is set", () => {
    mockUseActionState.mockReturnValue([
      {
        validationErrors: {},
        newOpportunitySummaryId: "new-summary-789",
      },
      jest.fn(),
      false,
    ]);

    renderOpportunityEditForm();

    expect(screen.getByDisplayValue("new-summary-789")).toHaveAttribute(
      "name",
      "opportunitySummaryId",
    );
  });
});

// ─── Funding details — field interactions ─────────────────────────────────────
// All funding-section inputs are controlled; onChange updates state and re-renders.
// Number inputs pass through formatNumber, formatting valid numbers with commas.
describe("OpportunityEditForm — funding details interactions", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("updates fundingType when the Select value changes", () => {
    renderOpportunityEditForm();

    const select = screen.getByRole("combobox", {
      name: /labels\.fundingType/i,
    });
    fireEvent.change(select, { target: { value: "cooperative_agreement" } });

    expect(select).toHaveValue("cooperative_agreement");
  });

  it("updates costSharing to true when the Yes radio is clicked", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, costSharing: false },
    });

    const radio = screen.getByRole("radio", { name: /labels\.yes/i });
    fireEvent.click(radio);

    expect(radio).toBeChecked();
  });

  it("updates costSharing to false when the No radio is clicked", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, costSharing: true },
    });

    const radio = screen.getByRole("radio", { name: /labels\.no/i });
    fireEvent.click(radio);

    expect(radio).toBeChecked();
  });

  it("updates fundingCategories when the category Select changes", () => {
    renderOpportunityEditForm();

    const select = screen.getByRole("combobox", { name: /labels\.category/i });
    fireEvent.change(select, { target: { value: "health" } });

    expect(select).toHaveValue("health");
  });

  it("updates expectedNumberOfAwards when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.expectedNumberOfAwards/i,
    });
    fireEvent.change(input, { target: { value: "10" } });

    expect(input).toHaveValue("10");
  });

  it("formats estimatedTotalProgramFunding with commas from initialValues", () => {
    renderOpportunityEditForm({
      initialValues: {
        ...initialValues,
        estimatedTotalProgramFunding: "750000",
      },
    });

    const input = screen.getByRole("textbox", {
      name: /labels\.estimatedTotalProgramFunding/i,
    });

    expect(input).toHaveValue("750,000");
  });

  it("updates awardMinimum when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMinimum/i,
    });
    fireEvent.change(input, { target: { value: "500" } });

    expect(input).toHaveValue("500");
  });

  it("formats awardMaximum with commas from initialValues", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, awardMaximum: "5000" },
    });

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMaximum/i,
    });

    expect(input).toHaveValue("5,000");
  });

  it("updates fundingCategoryExplanation when the textarea changes", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, fundingCategories: "other" },
    });

    const textarea = screen.getByRole("textbox", {
      name: /labels\.fundingCategoryExplanation/i,
    });
    fireEvent.change(textarea, { target: { value: "Explanation text" } });

    expect(textarea).toHaveValue("Explanation text");
  });

  it("updates closeDateExplanation when the textarea changes", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, closeDate: "" },
    });

    const textarea = screen.getByRole("textbox", {
      name: /labels\.closeDateExplanation/i,
    });
    fireEvent.change(textarea, { target: { value: "No close date set" } });

    expect(textarea).toHaveValue("No close date set");
  });
});

// ─── Eligibility and additional info — field interactions ─────────────────────
// Controlled inputs in the eligibility and additional information sections;
// onChange updates are reflected in the displayed value.
describe("OpportunityEditForm — eligibility and additional info interactions", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("updates additionalEligibilityInfo when the textarea changes", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, eligibleApplicants: ["other"] },
    });

    const textarea = screen.getByRole("textbox", {
      name: /labels\.additionalEligibilityInfo/i,
    });
    fireEvent.change(textarea, { target: { value: "Any eligibility info" } });

    expect(textarea).toHaveValue("Any eligibility info");
  });

  it("updates description when the textarea changes", () => {
    renderOpportunityEditForm();

    const textarea = screen.getByRole("textbox", {
      name: /labels\.description/i,
    });
    fireEvent.change(textarea, { target: { value: "Updated description" } });

    expect(textarea).toHaveValue("Updated description");
  });

  it("updates additionalInfoUrl when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: "labels.additionalInfoUrl",
    });
    fireEvent.change(input, { target: { value: "https://new.example.com" } });

    expect(input).toHaveValue("https://new.example.com");
  });

  it("updates additionalInfoUrlText when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: "labels.additionalInfoUrlText",
    });
    fireEvent.change(input, { target: { value: "New link text" } });

    expect(input).toHaveValue("New link text");
  });

  it("updates grantorContactDetails when the textarea changes", () => {
    renderOpportunityEditForm();

    const textarea = screen.getByRole("textbox", {
      name: /labels\.grantorContactDetails/i,
    });
    fireEvent.change(textarea, { target: { value: "Updated contact info" } });

    expect(textarea).toHaveValue("Updated contact info");
  });

  it("updates contactEmail when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: "labels.contactEmail",
    });
    fireEvent.change(input, { target: { value: "new@example.com" } });

    expect(input).toHaveValue("new@example.com");
  });

  it("updates contactEmailText when the input changes", () => {
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: "labels.contactEmailText",
    });
    fireEvent.change(input, { target: { value: "Email us here" } });

    expect(input).toHaveValue("Email us here");
  });
});

// ─── Inline validation errors ─────────────────────────────────────────────────
// When the save action returns field-level errors, each affected input renders
// an ErrorMessage. All fields are exercised in a single scenario.
describe("OpportunityEditForm — inline validation errors", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows inline validation errors for all fields simultaneously", () => {
    mockUseActionState.mockReturnValue([
      {
        validationErrors: {
          fundingType: ["Funding type required"],
          fundingCategory: ["Funding category required"],
          expectedNumberOfAwards: ["Must be a number"],
          estimatedTotalProgramFunding: ["Must be a number"],
          awardMinimum: ["Award minimum invalid"],
          awardMaximum: ["Award maximum invalid"],
          publishDate: ["Publish date required"],
          closeDate: ["Close date required"],
          eligibleApplicants: ["Eligible applicants required"],
          description: ["Description required"],
          additionalInfoUrl: ["Invalid URL"],
          additionalInfoUrlText: ["URL text required"],
          grantorContactDetails: ["Contact details required"],
          contactEmail: ["Invalid email"],
          contactEmailText: ["Contact email text required"],
          additionalEligibilityInfo: ["Additional eligibility info required"],
        },
      },
      jest.fn(),
      false,
    ]);

    renderOpportunityEditForm({
      initialValues: {
        ...initialValues,
        // show the additionalEligibilityInfo field so its inline error renders
        eligibleApplicants: ["other"],
      },
    });

    expect(screen.getAllByText("Funding type required")).toHaveLength(2);
    expect(screen.getAllByText("Eligible applicants required")).toHaveLength(2);
    expect(screen.getAllByText("Invalid email")).toHaveLength(2);
    expect(
      screen.getAllByText("Additional eligibility info required"),
    ).toHaveLength(2);
  });
});

// ─── Number formatting edge cases ────────────────────────────────────────────
// Non-numeric and empty strings must pass through unchanged rather than being zeroed out.
describe("OpportunityEditForm — number formatting edge cases", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("displays a non-numeric awardMinimum value as-is without formatting", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, awardMinimum: "abc" },
    });

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMinimum/i,
    });

    // formatNumber("abc") → isNaN branch → returns "abc" as-is
    expect(input).toHaveValue("abc");
  });

  it("displays an empty awardMaximum as an empty string without formatting", () => {
    renderOpportunityEditForm({
      initialValues: { ...initialValues, awardMaximum: "" },
    });

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMaximum/i,
    });

    // formatNumber("") → !raw branch → returns ""
    expect(input).toHaveValue("");
  });
});

// ─── Action buttons ───────────────────────────────────────────────────────────
// Save, Preview, and Publish buttons are rendered at the top of the form.
// Publish is enabled only when all four required fields are populated.
describe("OpportunityEditForm — action buttons", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders two Save buttons", () => {
    renderOpportunityEditForm();
    // NOTE: the third save button is in the header
    expect(
      screen.getByRole("button", { name: "button.saveAndGoBack" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "button.saveAndContinue" }),
    ).toBeInTheDocument();
  });

  it("calls the form action when saveAndGoBack is clicked", () => {
    const mockFormAction = jest.fn();
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      mockFormAction,
      false,
    ]);

    renderOpportunityEditForm();

    fireEvent.click(
      screen.getByRole("button", { name: "button.saveAndGoBack" }),
    );

    expect(mockFormAction).toHaveBeenCalledTimes(1);
  });

  it("calls the form action when saveAndContinue is clicked", () => {
    const mockFormAction = jest.fn();
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      mockFormAction,
      false,
    ]);

    renderOpportunityEditForm();

    fireEvent.click(
      screen.getByRole("button", { name: "button.saveAndContinue" }),
    );

    expect(mockFormAction).toHaveBeenCalledTimes(1);
  });
});

// ─── Field validations on exiting the field ──────────────────────────────────
describe("OpportunityEditForm — field validations on exiting the field", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const overMaxLimit = "1000000000000001";

  it("awardMinimum should show an error if the value is greater than the max allowed", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMinimum/i,
    });
    await user.type(input, overMaxLimit);
    await user.tab();

    expect(
      screen.getByText("validationErrors.awardMinCurrencyInput"),
    ).toBeInTheDocument();
  });

  it("awardMaximum should show an error if the value is greater than the max allowed", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMaximum/i,
    });
    await user.type(input, overMaxLimit);
    await user.tab();

    expect(
      screen.getByText("validationErrors.awardMaxCurrencyInput"),
    ).toBeInTheDocument();
  });

  it("estimatedTotalProgramFunding should show an error if the value is greater than the max allowed", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.estimatedTotalProgramFunding/i,
    });
    await user.type(input, overMaxLimit);
    await user.tab();

    expect(
      screen.getByText("validationErrors.totalFundingCurrencyInput"),
    ).toBeInTheDocument();
  });

  it("awardMinimum should show an error if the value is less than 0", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMinimum/i,
    });
    await user.clear(input);
    await user.type(input, "-50000");
    await user.tab();

    expect(
      screen.getByText("validationErrors.awardMinCurrencyInput"),
    ).toBeInTheDocument();
  });

  it("awardMaximum should show an error if the value is less than 0", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.awardMaximum/i,
    });
    await user.clear(input);
    await user.type(input, "-50000");
    await user.tab();

    expect(
      screen.getByText("validationErrors.awardMaxCurrencyInput"),
    ).toBeInTheDocument();
  });

  it("estimatedTotalProgramFunding should show an error if the value is less than 0", async () => {
    const user = userEvent.setup();
    renderOpportunityEditForm();

    const input = screen.getByRole("textbox", {
      name: /labels\.estimatedTotalProgramFunding/i,
    });
    await user.clear(input);
    await user.type(input, "-1000");
    await user.tab();

    expect(
      screen.getByText("validationErrors.totalFundingCurrencyInput"),
    ).toBeInTheDocument();
  });
});
