import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";
import SearchSortBy from "../../../src/components/search/SearchSortBy";
import { axe } from "jest-axe";

// Mock the useSearchParamUpdater hook
jest.mock("../../../src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: jest.fn(),
  }),
}));

describe("SearchSortBy", () => {
  const initialQueryParams = "opportunityNumberAsc";
  const mockFormRef = React.createRef<HTMLFormElement>();

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchSortBy
        formRef={mockFormRef}
        initialQueryParams={initialQueryParams}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders correctly with initial query params", () => {
    render(
      <SearchSortBy
        formRef={mockFormRef}
        initialQueryParams={initialQueryParams}
      />,
    );

    expect(
      screen.getByDisplayValue("Opportunity Number (Ascending)"),
    ).toBeInTheDocument();
  });

  it("updates sort option and submits the form on change", () => {
    const formElement = document.createElement("form");
    const requestSubmitMock = jest.fn();
    formElement.requestSubmit = requestSubmitMock;

    render(
      <SearchSortBy
        formRef={{ current: formElement }}
        initialQueryParams={initialQueryParams}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "opportunityTitleDesc" },
    });

    expect(
      screen.getByDisplayValue("Opportunity Title (Descending)"),
    ).toBeInTheDocument();

    expect(requestSubmitMock).toHaveBeenCalled();
  });
});
