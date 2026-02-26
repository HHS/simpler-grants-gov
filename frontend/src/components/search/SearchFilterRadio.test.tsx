import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import React from "react";

import { SearchFilterRadio } from "src/components/search/SearchFilterRadio";

const mockOnChange = jest.fn();

describe("SearchFilterRadio", () => {
  const baseProps = {
    id: "test-radio",
    name: "testRadioGroup",
    label: "Test Radio Option",
    onChange: mockOnChange,
    checked: false,
    value: "testValue",
    facetCount: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SearchFilterRadio {...baseProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the radio button with correct label, name, and facet count", () => {
    render(<SearchFilterRadio {...baseProps} />);
    const radio = screen.getByRole("radio", {
      name: /Test Radio Option \[3\]/,
    });
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute("type", "radio");
    expect(radio).toHaveAttribute("name", baseProps.name);
  });

  it("calls onChange handler when clicked", async () => {
    render(<SearchFilterRadio {...baseProps} />);
    const radio = screen.getByRole("radio", {
      name: /Test Radio Option \[3\]/,
    });
    await userEvent.click(radio);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("is checked when checked prop is true", () => {
    render(<SearchFilterRadio {...baseProps} checked={true} />);
    const radio = screen.getByRole("radio", {
      name: /Test Radio Option \[3\]/,
    });
    expect(radio).toBeChecked();
  });

  it("is not checked when checked prop is false", () => {
    render(<SearchFilterRadio {...baseProps} checked={false} />);
    const radio = screen.getByRole("radio", {
      name: /Test Radio Option \[3\]/,
    });
    expect(radio).not.toBeChecked();
  });

  it("renders without facet count if not provided", () => {
    render(<SearchFilterRadio {...baseProps} facetCount={undefined} />);
    const radio = screen.getByRole("radio", { name: "Test Radio Option" });
    expect(radio).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<SearchFilterRadio {...baseProps} disabled={true} />);
    const radio = screen.getByRole("radio", {
      name: /Test Radio Option \[3\]/,
    });
    expect(radio).toBeDisabled();
  });
});
