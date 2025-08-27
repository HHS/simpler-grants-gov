import { fireEvent, render, screen } from "@testing-library/react";

import RadioWidget from "src/components/applyForm/widgets/RadioWidget";

describe("RadioWidget: string enum", () => {
  const WidgetProps = {
    id: "test",
    schema: {
      title: "Choose an option",
      enum: ["Option 1", "Option 2", "Option 3"],
    },
    value: "Option 1",
    required: true,
    options: {},
  };

  it("renders the title and radio options", () => {
    render(<RadioWidget {...WidgetProps} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 3")).toBeInTheDocument();
  });

  it("sets the correct default value", () => {
    render(<RadioWidget {...WidgetProps} />);
    expect(screen.getByLabelText("Option 1")).toBeChecked();
  });

  it("emits the string value on change when updateOnInput=true", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
    };

    render(<RadioWidget {...props} />);
    const option2 = screen.getByLabelText<HTMLInputElement>("Option 2");
    fireEvent.click(option2);
    expect(mockOnChange).toHaveBeenCalledWith("Option 2");
  });

  it("marks radios as required if field is required", () => {
    render(<RadioWidget {...WidgetProps} />);
    expect(screen.getByLabelText("Option 1")).toBeRequired();
  });

  it("disables options when disabled is true", () => {
    render(<RadioWidget {...{ ...WidgetProps, disabled: true }} />);
    expect(screen.getByLabelText("Option 1")).toBeDisabled();
    expect(screen.getByLabelText("Option 2")).toBeDisabled();
    expect(screen.getByLabelText("Option 3")).toBeDisabled();
  });
});

describe("RadioWidget: boolean enum (Yes/No)", () => {
  it("emits boolean true/false on change when updateOnInput=true", () => {
    const mockOnChange = jest.fn();

    render(
      <RadioWidget
        id="debt"
        schema={{ title: "Delinquent Federal Debt", type: "boolean" }}
        options={{
          enumOptions: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        }}
        value={true}
        required
        updateOnInput
        onChange={mockOnChange}
      />,
    );

    const yes = screen.getByLabelText<HTMLInputElement>("Yes");
    const no = screen.getByLabelText<HTMLInputElement>("No");

    expect(yes).toBeChecked();
    expect(no).not.toBeChecked();

    fireEvent.click(no);
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it("marks radios as required if field is required", () => {
    render(
      <RadioWidget
        id="debt"
        schema={{ title: "Delinquent Federal Debt", type: "boolean" }}
        options={{
          enumOptions: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        }}
        value={false}
        required
      />,
    );

    expect(screen.getByLabelText("Yes")).toBeRequired();
    expect(screen.getByLabelText("No")).toBeRequired();
  });
});
