import { fireEvent, render, screen } from "@testing-library/react";

import CheckboxWidget from "src/components/apply-form/widgets/CheckboxWidget";

const WidgetProps = {
  id: "test",
  schema: {
    title: "I agree",
    description: "Test description",
  },
  value: true,
  required: true,
  options: {},
};

describe("CheckboxWidget", () => {
  it("renders the title and description", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    const checkbox = screen.getByRole("checkbox", {
      name: "I agree * Test description",
    });
    const description = screen.getByText("Test description");

    expect(checkbox).toBeRequired();
    expect(description).toHaveTextContent("Test description");
    expect(description).toHaveClass("usa-checkbox__label-description");
  });

  it("renders the SF-424 Short certification copy once and in the approved order", () => {
    const description =
      "** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions. By signing this application, I certify (1) to the statements contained in the list of certifications and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)";

    render(
      <CheckboxWidget
        {...WidgetProps}
        schema={{ title: "** I Agree", description }}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /\*\* I Agree/ });
    const renderedDescription = screen.getByText(description);

    expect(checkbox).toBeRequired();
    expect(renderedDescription).toHaveTextContent(
      /^\*\* The list of certifications.*By signing this application/,
    );
    expect(screen.getAllByText(description)).toHaveLength(1);
  });

  it("sets the correct default value", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("unchecked when no value", () => {
    const props = { ...WidgetProps, value: false };
    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("handles value changes", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
      value: false,
    };

    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it("renders required attribute when necessary", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeRequired();
  });

  it("disables options when disabled is true", () => {
    const props = { ...WidgetProps, disabled: true };
    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toBeDisabled();
  });
});
