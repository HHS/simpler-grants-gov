import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen } from "tests/react-utils";

import SavedOpportunityStatusFilter from "src/components/saved-opportunities/SavedOpportunityStatusFilter";

const setQueryParamMock = jest.fn();
const removeQueryParamMock = jest.fn();

// Mock the useSearchParamUpdater hook
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: setQueryParamMock,
    removeQueryParam: removeQueryParamMock,
  }),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

describe("SavedOpportunityStatusFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SavedOpportunityStatusFilter status={null} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders correctly with no status selected (default)", () => {
    render(<SavedOpportunityStatusFilter status={null} />);

    const defaultOption = screen.getByRole("option", {
      selected: true,
    });
    expect(defaultOption).toBeVisible();
    expect(defaultOption).toHaveTextContent("Any opportunity status");

    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("renders all status options", () => {
    render(<SavedOpportunityStatusFilter status={null} />);

    expect(screen.getByText("Any opportunity status")).toBeInTheDocument();
    expect(screen.getByText("Forecasted")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("renders with a pre-selected status", () => {
    render(<SavedOpportunityStatusFilter status="posted" />);

    const selectedOption = screen.getByRole("option", {
      selected: true,
    });
    expect(selectedOption).toHaveTextContent("Open");
  });

  it("calls setQueryParam when selecting a status", () => {
    render(<SavedOpportunityStatusFilter status={null} />);

    fireEvent.change(screen.getByLabelText("statusFilter.label"), {
      target: { value: "forecasted" },
    });

    expect(setQueryParamMock).toHaveBeenCalledWith("status", "forecasted");
    expect(removeQueryParamMock).not.toHaveBeenCalled();
  });

  it("calls removeQueryParam when selecting 'Any opportunity status'", () => {
    render(<SavedOpportunityStatusFilter status="posted" />);

    fireEvent.change(screen.getByLabelText("statusFilter.label"), {
      target: { value: "" },
    });

    expect(removeQueryParamMock).toHaveBeenCalledWith("status");
    expect(setQueryParamMock).not.toHaveBeenCalled();
  });

  it("updates selection visually on change", () => {
    render(<SavedOpportunityStatusFilter status={null} />);

    let selectedOption = screen.getByRole("option", {
      selected: true,
    });
    expect(selectedOption).not.toHaveTextContent("Closed");

    fireEvent.select(screen.getByRole("combobox"), {
      target: { value: "closed" },
    });

    selectedOption = screen.getByRole("option", {
      selected: true,
    });
    expect(selectedOption).toHaveTextContent("Closed");
  });
});
