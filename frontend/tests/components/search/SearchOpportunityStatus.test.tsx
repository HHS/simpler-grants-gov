import "@testing-library/jest-dom/extend-expect";

import { render, screen } from "@testing-library/react";

import React from "react";
import SearchOpportunityStatus from "../../../src/components/search/SearchOpportunityStatus";
import { axe } from "jest-axe";

jest.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => unknown) => {
    return [fn, jest.fn()];
  },
}));

const mockUpdateQueryParams = jest.fn();

jest.mock("../../../src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

describe("SearchOpportunityStatus", () => {
  let formRef: React.RefObject<HTMLFormElement>;

  beforeEach(() => {
    formRef = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current: { requestSubmit: jest.fn() } as any as HTMLFormElement,
    };
  });

  it("passes accessibility scan", async () => {
    const { container } = render(
      <SearchOpportunityStatus formRef={formRef} initialStatuses="" />,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("component renders with checkboxes", () => {
    render(<SearchOpportunityStatus formRef={formRef} initialStatuses="" />);

    expect(screen.getByText("Forecasted")).toBeEnabled();
    expect(screen.getByText("Posted")).toBeEnabled();
    expect(screen.getByText("Closed")).toBeEnabled();
    expect(screen.getByText("Archived")).toBeEnabled();
  });

  /* eslint-disable jest/no-commented-out-tests */

  // TODO: Fix additional tests

  //   it("checking a checkbox calls updateQueryParams and requestSubmit", async () => {
  //     render(<SearchOpportunityStatus formRef={formRef} />);

  //     // No need to wait for component to mount since we're not testing that here
  //     const forecastedCheckbox = screen.getByRole("checkbox", {
  //       name: "Forecasted",
  //     });

  //     fireEvent.click(forecastedCheckbox);

  //     // Since we mocked useDebouncedCallback, we expect the function to be called immediately
  //     // Make sure to check for both updateQueryParams and requestSubmit
  //     // expect(formRef.current.requestSubmit).toHaveBeenCalled();
  //     expect(mockUpdateQueryParams).toHaveBeenCalledWith(
  //       new Set(["forecasted"]),
  //       "status",
  //     );
  //   });

  // TODO:  Add more tests as needed to cover other interactions and edge cases
});
