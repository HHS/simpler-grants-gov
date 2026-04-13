import { fireEvent, render, screen } from "@testing-library/react";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";

const mockCheckbox = jest.fn();

jest.mock("@trussworks/react-uswds", () => ({
  Checkbox: (props: {
    id: string;
    name: string;
    checked: boolean;
    disabled?: boolean;
    onChange?: (event: { target: { checked: boolean } }) => void;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }) => {
    mockCheckbox(props);

    return (
      <input
        type="checkbox"
        data-testid="notification-checkbox"
        id={props.id}
        name={props.name}
        checked={props.checked}
        disabled={props.disabled}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        onChange={(event) => {
          props.onChange?.({
            target: {
              checked: event.currentTarget.checked,
            },
          });
        }}
      />
    );
  },
}));

describe("NotificationPreferenceCard", () => {
  const baseProps = {
    checkboxId: "test-checkbox",
    label: "Test Label",
    description: "Test Description",
    isChecked: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders label and description", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders checkbox in checked state", () => {
    render(<NotificationPreferenceCard {...baseProps} isChecked={true} />);

    expect(screen.getByTestId("notification-checkbox")).toBeChecked();
  });

  it("renders checkbox in unchecked state", () => {
    render(<NotificationPreferenceCard {...baseProps} isChecked={false} />);

    expect(screen.getByTestId("notification-checkbox")).not.toBeChecked();
  });

  it("calls onCheckedChange when toggled", () => {
    const handleChange = jest.fn();

    render(
      <NotificationPreferenceCard
        {...baseProps}
        onCheckedChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-checkbox"));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("uses noop when onCheckedChange is not provided", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(() => {
      fireEvent.click(screen.getByTestId("notification-checkbox"));
    }).not.toThrow();
  });

  it("disables checkbox when isDisabled is true", () => {
    render(<NotificationPreferenceCard {...baseProps} isDisabled={true} />);

    expect(screen.getByTestId("notification-checkbox")).toBeDisabled();
  });

  it("disables checkbox when loading", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(screen.getByTestId("notification-checkbox")).toBeDisabled();
  });

  it("shows loading text when isLoading is true", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("does not show loading text when not loading", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
  });

  it("passes disabled=false to Checkbox when not disabled or loading", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(mockCheckbox).toHaveBeenCalledWith(
      expect.objectContaining({
        checked: false,
        disabled: false,
      }),
    );
  });

  it("passes disabled=true to Checkbox when loading", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(mockCheckbox).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
    );
  });

  it("constructs aria-labelledby with organizationHeadingId", () => {
    render(
      <NotificationPreferenceCard
        {...baseProps}
        organizationHeadingId="org-heading"
      />,
    );

    expect(screen.getByTestId("notification-checkbox")).toHaveAttribute(
      "aria-labelledby",
      "org-heading test-checkbox-label",
    );
  });

  it("constructs aria-labelledby from field label when organizationHeadingId is missing", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.getByTestId("notification-checkbox")).toHaveAttribute(
      "aria-labelledby",
      "test-checkbox-label",
    );
  });

  it("constructs aria-describedby from description id", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.getByTestId("notification-checkbox")).toHaveAttribute(
      "aria-describedby",
      "test-checkbox-description",
    );
  });
});
