import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";

const mockCheckbox = jest.fn();

jest.mock("@trussworks/react-uswds", () => ({
  Checkbox: (props: {
    id: string;
    name: string;
    checked: boolean;
    disabled?: boolean;
    onChange?: (event: {
      target: { checked: boolean };
      currentTarget: { checked: boolean };
    }) => void;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    "aria-disabled"?: boolean;
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
        aria-disabled={props["aria-disabled"]}
        onChange={(event) => {
          props.onChange?.({
            target: {
              checked: event.currentTarget.checked,
            },
            currentTarget: {
              checked: event.currentTarget.checked,
            },
          });
        }}
      />
    );
  },
}));

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <span role="progressbar" aria-label="Loading!" />,
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

  it("keeps checkbox enabled but aria-disabled when loading", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);
    const checkbox = screen.getByTestId("notification-checkbox");
    expect(checkbox).toBeEnabled();
    expect(checkbox).toHaveAttribute("aria-disabled", "true");
  });

  it("does not call onCheckedChange when toggled while loading", () => {
    const handleChange = jest.fn();

    render(
      <NotificationPreferenceCard
        {...baseProps}
        isLoading={true}
        onCheckedChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-checkbox"));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("shows loading indicator when isLoading is true", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("srPendingSave")).toBeInTheDocument();
  });

  it("does not show loading indicator when not loading", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("disabled=falsewhen disabled/loading", () => {
    render(<NotificationPreferenceCard {...baseProps} />);
    expect(mockCheckbox).toHaveBeenCalledWith(
      expect.objectContaining({
        checked: false,
        disabled: false,
        "aria-disabled": false,
      }),
    );
  });

  it("passes aria-disabled=true without disabled to Checkbox when loading", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);
    expect(mockCheckbox).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: false,
        "aria-disabled": true,
      }),
    );
  });

  describe("keyboard interaction", () => {
    const getCheckbox = () => screen.getByTestId("notification-checkbox");

    it("focuses the checkbox with Tab", async () => {
      const user = userEvent.setup();
      render(<NotificationPreferenceCard {...baseProps} />);
      await user.tab();
      expect(getCheckbox()).toHaveFocus();
    });

    it("calls onCheckedChange with false when space is pressed on a checked checkbox", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <NotificationPreferenceCard
          {...baseProps}
          isChecked={true}
          onCheckedChange={handleChange}
        />,
      );

      await user.tab();
      await user.keyboard(" ");
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("calls onCheckedChange when space is pressed", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <NotificationPreferenceCard
          {...baseProps}
          onCheckedChange={handleChange}
        />,
      );

      await user.tab();
      await user.keyboard(" ");
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("keeps focus on the checkbox and ignores toggle while loading", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <NotificationPreferenceCard
          {...baseProps}
          isLoading={true}
          onCheckedChange={handleChange}
        />,
      );
      await user.tab();
      expect(getCheckbox()).toHaveFocus();
      await user.keyboard(" ");
      expect(handleChange).not.toHaveBeenCalled();
      expect(getCheckbox()).toHaveFocus();
    });
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

  it("applies additional className to the card", () => {
    const { container } = render(
      <NotificationPreferenceCard {...baseProps} className="a" />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    expect(container.firstChild).toHaveClass(
      "notification-preference-card",
      "a",
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
