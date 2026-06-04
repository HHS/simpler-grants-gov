import { fireEvent, render, screen } from "@testing-library/react";

import { NotificationPreferenceCardProps } from "./NotificationPreferenceCard";
import { OrganizationPreferenceSection } from "./OrganizationPreferenceSection";

type MockNotificationPreferenceCardProps = Pick<
  NotificationPreferenceCardProps,
  | "checkboxId"
  | "label"
  | "description"
  | "isChecked"
  | "organizationHeadingId"
  | "isDisabled"
  | "isLoading"
  | "hasError"
  | "errorMessage"
  | "onCheckedChange"
>;

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "organizationPreferencesSuffix") {
      return "preferences";
    }

    return key;
  },
}));

const mockCard = jest.fn();

jest.mock("./NotificationPreferenceCard", () => ({
  NotificationPreferenceCard: (props: MockNotificationPreferenceCardProps) => {
    mockCard(props);

    return (
      <div>
        <button
          data-testid="card-toggle"
          onClick={() => props.onCheckedChange?.(!props.isChecked)}
        >
          toggle
        </button>
      </div>
    );
  },
}));

describe("OrganizationPreferenceSection", () => {
  const baseProps = {
    organization: {
      organizationId: "123",
      organizationName: "Test Org",
    },
    label: "Saved Opportunities",
    description: "Test description",
    isChecked: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders organization name as heading", () => {
    render(<OrganizationPreferenceSection {...baseProps} />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Test Org",
    );
  });

  it("includes screen reader suffix text", () => {
    render(<OrganizationPreferenceSection {...baseProps} />);

    expect(screen.getByText("preferences")).toBeInTheDocument();
  });

  it("sets correct aria-labelledby on section", () => {
    render(<OrganizationPreferenceSection {...baseProps} />);

    const section = screen.getByRole("region", {
      name: /test org/i,
    });

    expect(section).toHaveAttribute("aria-labelledby", "organization-123");
  });

  it("passes correct props to NotificationPreferenceCard", () => {
    render(<OrganizationPreferenceSection {...baseProps} />);

    expect(mockCard).toHaveBeenCalledWith(
      expect.objectContaining({
        checkboxId: "organization-123-saved-opportunities",
        label: "Saved Opportunities",
        description: "Test description",
        isChecked: false,
        organizationHeadingId: "organization-123",
      }),
    );
  });

  it("passes state props correctly", () => {
    render(
      <OrganizationPreferenceSection
        {...baseProps}
        isChecked={true}
        isDisabled={true}
        isLoading={true}
        hasError={true}
      />,
    );

    expect(mockCard).toHaveBeenCalledWith(
      expect.objectContaining({
        isChecked: true,
        isDisabled: true,
        isLoading: true,
        hasError: true,
      }),
    );
  });

  it("calls onCheckedChange when toggled", () => {
    const handleChange = jest.fn();

    render(
      <OrganizationPreferenceSection
        {...baseProps}
        onCheckedChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByTestId("card-toggle"));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("handles missing onCheckedChange safely", () => {
    render(<OrganizationPreferenceSection {...baseProps} />);

    expect(() => {
      fireEvent.click(screen.getByTestId("card-toggle"));
    }).not.toThrow();
  });
});
