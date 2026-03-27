import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

import { CreateOpportunityForm } from "src/components/opportunities/create/CreateOpportunityForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock(
  "src/app/[locale]/(base)/opportunities/create/[agencyId]/actions",
  () => ({
    createOpportunityAction: noop,
  }),
);

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const fakeId = "456-XYZ";
const fakeAgencies = {
  "123-ABC": "Agency Alpha",
  "456-XYZ": "Agency Beta",
};

describe("createOpportunityForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("displays values from agency list props and defaults agency selection", () => {
    mockUseActionState.mockReturnValue([{}, noop, false]);

    render(
      <CreateOpportunityForm
        defaultAgencyId={fakeId}
        userAgencies={fakeAgencies}
      />,
    );

    // check that all agencies are in the select options
    expect(screen.getByText("Agency Beta")).toBeInTheDocument();
    expect(screen.getByText("Agency Alpha")).toBeInTheDocument();

    // check that the default agency was selected
    const selectedOption = screen.getByRole("option", {
      name: "Agency Beta",
      selected: true,
    });
    expect(selectedOption).toBeInTheDocument();
  });

  // --- Test the return values from action ---
  it("displays values from form action when available", () => {
    mockUseActionState.mockReturnValue([
      {
        data: {
          agency_id: "123-ABC",
          opportunity_number: "MY-TEST-001",
          opportunity_title: "Test Opportunity 001",
          category: "other",
          category_explanation: "",
          assistance_listing_number: "12-345",
        },
      },
      noop,
      false,
    ]);

    render(
      <CreateOpportunityForm
        defaultAgencyId={fakeId}
        userAgencies={fakeAgencies}
      />,
    );

    expect(screen.getByDisplayValue("MY-TEST-001")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Test Opportunity 001"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("12-345")).toBeInTheDocument();
  });

  // --- Test errors from action ---
  it("displays error message on error", () => {
    mockUseActionState.mockReturnValue([
      { errorMessage: "big error" },
      noop,
      false,
    ]);

    render(
      <CreateOpportunityForm
        defaultAgencyId={fakeId}
        userAgencies={fakeAgencies}
      />,
    );

    const alert = screen.getByRole("heading", { name: "errorHeading" });
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("errorHeading");

    const errorText = screen.getByText("big error");
    expect(errorText).toBeInTheDocument();
  });
});

describe("createOpportunityForm field change events", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("the save button is enabled when required fields have values", async () => {
    mockUseActionState.mockReturnValue([{}, noop, false]);

    render(
      <CreateOpportunityForm
        defaultAgencyId={fakeId}
        userAgencies={fakeAgencies}
      />,
    );

    // 1. Initially default agency is selected and save button is disabled
    const selectedOption = screen.getByRole("option", {
      name: "Agency Beta",
      selected: true,
    });
    expect(selectedOption).toBeInTheDocument();
    const saveButton = screen.queryByText("saveAndContinue");
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // 2. Fill in Opportunity Number
    const textboxOppNbr = screen.getByRole("textbox", {
      name: "CreateOpportunityForm.opportunityNumber *",
    });
    expect(textboxOppNbr).toBeInTheDocument();
    expect(textboxOppNbr).toHaveValue("");
    fireEvent.change(textboxOppNbr, { target: { value: "TEST-001" } });
    expect(textboxOppNbr).toHaveValue("TEST-001");
    // Save button should still be disabled
    expect(saveButton).toBeDisabled();

    // 3. Fill in Opportunity Title
    const textareaOppTitle = screen.getByRole("textbox", {
      name: "CreateOpportunityForm.opportunityTitle *",
    });
    expect(textareaOppTitle).toBeInTheDocument();
    expect(textareaOppTitle).toHaveValue("");
    fireEvent.change(textareaOppTitle, {
      target: { value: "Test Opportunity 001" },
    });
    expect(textareaOppTitle).toHaveValue("Test Opportunity 001");
    // Save button should still be disabled
    expect(saveButton).toBeDisabled();

    // 4. Enter an ALN
    const assitListNbr = screen.getByRole("textbox", {
      name: "CreateOpportunityForm.assistanceListingNumber *",
    });
    expect(assitListNbr).toBeInTheDocument();
    expect(assitListNbr).toHaveValue("");
    fireEvent.change(assitListNbr, { target: { value: "12-345" } });
    expect(assitListNbr).toHaveValue("12-345");
    // Save button should still be disabled
    expect(saveButton).toBeDisabled();

    // 5. Select a Category that is not "other"
    const selectCategory = screen.getByRole("combobox", {
      name: "CreateOpportunityForm.category *",
    });
    expect(selectCategory).toBeInTheDocument();
    expect(selectCategory).toHaveValue("");
    await userEvent.selectOptions(selectCategory, "discretionary");
    expect(selectCategory).toHaveValue("discretionary");
    // Save button should now be enabled
    expect(saveButton).toBeEnabled();
    // The Explanation field should be hidden
    const testExplain = screen.queryByRole("textbox", {
      name: "CreateOpportunityForm.categoryExplanation *",
    });
    expect(testExplain).not.toBeInTheDocument();

    // 6. Select "other" for the Category
    await userEvent.selectOptions(selectCategory, "other");
    expect(selectCategory).toHaveValue("other");
    // Save button should now be disabled
    expect(saveButton).toBeDisabled();
    // The Explanation field should now be displayed
    const textareaExplain = screen.getByRole("textbox", {
      name: "CreateOpportunityForm.categoryExplanation *",
    });
    expect(textareaExplain).toBeInTheDocument();
    expect(textareaExplain).toHaveValue("");

    // 7. Fill in the Category Explanation field
    fireEvent.change(textareaExplain, {
      target: { value: "Sample Explanation" },
    });
    expect(textareaExplain).toHaveValue("Sample Explanation");
    // Save button should now be enabled
    expect(saveButton).toBeEnabled();

    // 8. Remove/delete the text in Opportunity Title
    fireEvent.change(textareaOppTitle, {
      target: { value: "" },
    });
    expect(textareaOppTitle).toHaveValue("");
    // Save button should be disabled again
    expect(saveButton).toBeDisabled();
  });
});
