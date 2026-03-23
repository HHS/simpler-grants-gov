import { render, screen } from "@testing-library/react";
import { noop } from "lodash";

import { CreateOpportunityForm } from "src/components/opportunities/create/CreateOpportunityForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock("src/app/[locale]/(base)/opportunities/create/[agencyId]/actions", () => ({
  createOpportunityAction: noop,
}));

jest.mock('next/navigation', () => ({
useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
}),
usePathname: jest.fn(() => '/'),
useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const fakeId = "456-XYZ";
const fakeAgencies = {
    '123-ABC': 'Agency Alpha',
    '456-XYZ': 'Agency Beta' 
  };

describe("createOpportunityForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  // --- Test the props ---
  it("displays values from agency list props and defaults agency selection", () => {
    mockUseActionState.mockReturnValue([{}, noop, false]);

    render(<CreateOpportunityForm defaultAgencyId={fakeId} userAgencies={fakeAgencies} />);

    // check that all agencies are in the select options
    expect(screen.getByText('Agency Beta')).toBeInTheDocument();
    expect(screen.getByText('Agency Alpha')).toBeInTheDocument();

    // check that the default agency was selected
    const selectedOption = screen.getByRole('option', { name: 'Agency Beta', selected: true });
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
        },
      },
      noop,
      false,
    ]);

    render(<CreateOpportunityForm defaultAgencyId={fakeId} userAgencies={fakeAgencies} />);

    expect(screen.getByDisplayValue("MY-TEST-001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Opportunity 001")).toBeInTheDocument();
  });

  // --- Test errors from action ---
  it("displays error message on error", () => {
    mockUseActionState.mockReturnValue([
      { errorMessage: "big error" },
      noop,
      false,
    ]);

    render(<CreateOpportunityForm defaultAgencyId={fakeId} userAgencies={fakeAgencies} />);

    const alert = screen.getByRole("heading", { name: "errorHeading" });
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("errorHeading");

    const errorText = screen.getByText("big error");
    expect(errorText).toBeInTheDocument();
  });

});
