import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { render, screen } from "tests/react-utils";

import React from "react";

import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SectionLinkLabel from "src/components/search/SearchFilterAccordion/SearchFilterSection/SectionLinkLabel";

// Mock the Icon component from "@trussworks/react-uswds"
jest.mock("@trussworks/react-uswds", () => ({
  Icon: {
    ArrowDropUp: () => <span>ArrowDropUp Icon</span>,
    ArrowDropDown: () => <span>ArrowDropDown Icon</span>,
  },
}));

describe("SectionLinkLabel", () => {
  const optionMock: FilterOption = {
    id: "test ud",
    label: "Test Label",
    value: "test value",
  };

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SectionLinkLabel childrenVisible={false} option={optionMock} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders with the dropdown icon when children are not visible", () => {
    render(<SectionLinkLabel childrenVisible={false} option={optionMock} />);
    expect(screen.getByText("ArrowDropDown Icon")).toBeInTheDocument();
    expect(screen.getByText(optionMock.label)).toBeInTheDocument();
  });

  it("renders with the dropup icon when children are visible", () => {
    render(<SectionLinkLabel childrenVisible={true} option={optionMock} />);
    expect(screen.getByText("ArrowDropUp Icon")).toBeInTheDocument();
    expect(screen.getByText(optionMock.label)).toBeInTheDocument();
  });
});
