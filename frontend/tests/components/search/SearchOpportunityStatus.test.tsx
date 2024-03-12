import "@testing-library/jest-dom/extend-expect";

import { render, screen } from "@testing-library/react";

import React from "react";
import SearchOpportunityStatus from "../../../src/components/search/SearchOpportunityStatus";
import { axe } from "jest-axe";

// Mock hooks and dependencies as needed
jest.mock("../../../src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: jest.fn(),
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
    const { container } = render(<SearchOpportunityStatus formRef={formRef} />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("component renders with checkboxes", () => {
    render(<SearchOpportunityStatus formRef={formRef} />);

    expect(screen.getByText("Forecasted")).toBeEnabled();
    expect(screen.getByText("Posted")).toBeEnabled();
    expect(screen.getByText("Closed")).toBeEnabled();
    expect(screen.getByText("Archived")).toBeEnabled();
  });

  // TODO:  Add more tests as needed to cover other interactions and edge cases
});
