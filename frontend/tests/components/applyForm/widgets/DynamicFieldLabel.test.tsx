import { render, screen } from "@testing-library/react";

import { DynamicFieldLabel } from "src/components/applyForm/widgets/DynamicFieldLabel";

describe("DynamicFieldLabel", () => {
  it("renders the label with title only", () => {
    render(
      <DynamicFieldLabel
        idFor="test"
        title="Test Label"
        required={false}
        labelType="default"
      />,
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders the label with required asterisk", () => {
    render(
      <DynamicFieldLabel
        idFor="test"
        title="Test Label"
        required={true}
        labelType="default"
      />,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders the label and description when provided", () => {
    render(
      <DynamicFieldLabel
        idFor="test"
        title="Test Label"
        required={false}
        description="Helpful hint text"
        labelType="default"
      />,
    );

    expect(screen.getByText("Helpful hint text")).toBeInTheDocument();
  });

  it("hides the description when labelType is 'hide-helper-text'", () => {
    render(
      <DynamicFieldLabel
        idFor="test"
        title="Test Label"
        required={false}
        description="This should not show"
        labelType="hide-helper-text"
      />,
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.queryByText("This should not show")).not.toBeInTheDocument();
  });

  it("returns null if title is not provided", () => {
    const { container } = render(
      <DynamicFieldLabel idFor="test" title={undefined} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
