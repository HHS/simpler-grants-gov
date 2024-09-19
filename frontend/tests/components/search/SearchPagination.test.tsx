/* eslint-disable testing-library/no-node-access */
import "@testing-library/jest-dom/extend-expect";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import React from "react";

import SearchPagination from "src/components/search/SearchPagination";

// Mock the useSearchParamUpdater hook
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SearchPagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SearchPagination page={1} query={"test"} />);

    const results = await axe(container, {
      rules: {
        // Disable specific rules that are known to fail due to third-party components
        list: { enabled: false },
        "svg-img-alt": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
  it("Renders Pagination component when pages > 0", () => {
    render(<SearchPagination page={1} query={"test"} total={10} />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
  it("Does not render Pagination component when pages <= 0", () => {
    render(<SearchPagination page={1} query={"test"} total={0} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
