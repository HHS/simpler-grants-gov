import "@testing-library/jest-dom";

import { render, screen } from "tests/react-utils";

import React from "react";
import SectionLinkCount from "../../../../../src/components/search/SearchFilterAccordion/SearchFilterSection/SectionLinkCount";
import { axe } from "jest-axe";

describe("SectionLinkCount", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SectionLinkCount sectionCount={5} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the count when sectionCount is greater than 0", () => {
    const sectionCount = 5;
    render(<SectionLinkCount sectionCount={sectionCount} />);
    expect(screen.getByText(sectionCount.toString())).toBeInTheDocument();
  });

  it("does not render the count when sectionCount is 0", () => {
    render(<SectionLinkCount sectionCount={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
