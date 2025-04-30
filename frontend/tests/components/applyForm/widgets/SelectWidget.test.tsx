import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SelectWidget from "src/components/applyForm/widgets/SelectWidget";

const WidgetProps = {
  id: "test",
  schema: {
    title: "Choose an option",
    enum: ["Option 1", "Option 2", "Option 3"],
  },
  value: "Option 1",
  required: true,
  options: {
    enumOptions: [
      {
        value: "Option 1",
        label: "Option 1",
      },
      {
        value: "Option 2",
        label: "Option 2",
      },
      {
        value: "Option 3",
        label: "Option 3",
      },
    ],
    emptyValue: "- Select -",
  },
};

describe("SelectWidget", () => {
  afterEach(() => jest.clearAllMocks());
  beforeEach(() => jest.clearAllMocks());
  it("renders the title and options", () => {
    render(<SelectWidget {...WidgetProps} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBe(4);

    expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
  });
  it("selects new option", async () => {
    render(<SelectWidget {...WidgetProps} />);

    await userEvent.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "Option 2" }),
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      (screen.getByRole("option", { name: "Option 2" }) as HTMLOptionElement)
        .selected,
    ).toBe(true);
  });

  it("handles changes when reactive", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
    };

    render(<SelectWidget {...props} />);
    const select = screen.getByTestId("Select");
    fireEvent.change(select, { target: { value: "Option 1" } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("disabled when disabled is true", () => {
    const props = { ...WidgetProps, disabled: true };
    render(<SelectWidget {...props} />);
    expect(screen.getByTestId("Select")).toBeDisabled();
  });
  it("disables option correctly", () => {
    const options = {
      enumOptions: [
        {
          value: "Option 1",
          label: "Option 1",
        },
        {
          value: "Option 2",
          label: "Option 2",
        },
        {
          value: "Option 3",
          label: "Option 3",
        },
      ],
      emptyValue: "- Select -",
      enumDisabled: ["Option 2"],
    };
    const props = { ...WidgetProps, options };
    render(<SelectWidget {...props} />);
    expect(screen.getByRole("option", { name: "Option 2" })).toBeDisabled();
  });
});
