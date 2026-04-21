import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { NotificationPreferenceCardProps } from "./NotificationPreferenceCard";
import { NotificationsPageContent } from "./NotificationsPageContent";
import { OrganizationPreferenceSectionProps } from "./OrganizationPreferenceSection";

type MockNotificationPreferenceCardProps = Pick<
  NotificationPreferenceCardProps,
  | "checkboxId"
  | "label"
  | "isDisabled"
  | "isLoading"
  | "hasError"
  | "errorMessage"
  | "onCheckedChange"
>;

jest.mock("./NotificationPreferenceCard", () => ({
  NotificationPreferenceCard: ({
    checkboxId,
    label,
    isDisabled,
    isLoading,
    hasError,
    errorMessage,
    onCheckedChange,
  }: MockNotificationPreferenceCardProps) => (
    <div data-testid={`card-${checkboxId}`}>
      <span>{label}</span>

      <button
        type="button"
        onClick={() => onCheckedChange?.(true)}
        disabled={isDisabled}
        data-testid={`toggle-${checkboxId}`}
      >
        toggle
      </button>

      {isLoading ? <span>Saving...</span> : null}
      {hasError ? <span>{errorMessage}</span> : null}
    </div>
  ),
}));

type MockOrganizationPreferenceSectionProps = Pick<
  OrganizationPreferenceSectionProps,
  | "organization"
  | "isChecked"
  | "isLoading"
  | "hasError"
  | "errorMessage"
  | "onCheckedChange"
>;

jest.mock("./OrganizationPreferenceSection", () => ({
  OrganizationPreferenceSection: ({
    organization,
    isChecked,
    isLoading,
    hasError,
    errorMessage,
    onCheckedChange,
  }: MockOrganizationPreferenceSectionProps) => (
    <div data-testid={`org-section-${organization.organizationId}`}>
      <span>{organization.organizationName}</span>
      <span>{isChecked ? "checked" : "unchecked"}</span>

      <button
        type="button"
        onClick={() => onCheckedChange?.(true)}
        disabled={isLoading}
        data-testid={`org-toggle-${organization.organizationId}`}
      >
        toggle
      </button>

      {isLoading ? <span>Saving...</span> : null}
      {hasError ? <span>{errorMessage}</span> : null}
    </div>
  ),
}));

describe("NotificationsPageContent", () => {
  const baseProps = {
    pageHeading: "Notifications",
    fetchErrorMessage: "Failed to load organizations",
    managePreferencesTitle: "Manage Preferences",
    managePreferencesDescription: "Control your notifications",
    organizationPreferencesTitle: "Organization Preferences",
    organizationPreferencesDescription: "Manage org notifications",
    savedOpportunitiesLabel: "Saved Opportunities",
    savedOpportunitiesDescription: "Get notified about saved items",
    organizationSavedOpportunitiesDescription: "Org-specific setting",
    organizations: [
      { organizationId: "1", organizationName: "Org One" },
      { organizationId: "2", organizationName: "Org Two" },
    ],
    hasOrganizationsFetchError: false,
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders the page heading", () => {
    render(<NotificationsPageContent {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("does not render organization section when there are no organizations", () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    expect(
      screen.queryByText("Organization Preferences"),
    ).not.toBeInTheDocument();
  });

  it("renders fetch error when organization fetch fails", () => {
    render(
      <NotificationsPageContent
        {...baseProps}
        hasOrganizationsFetchError={true}
      />,
    );

    expect(
      screen.getByText("Failed to load organizations"),
    ).toBeInTheDocument();
  });

  it("shows loading and then both page-level and inline errors for the saved opportunities preference", async () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    fireEvent.click(screen.getByTestId("toggle-saved-opportunities"));

    expect(screen.getByText("Saving...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Your notification preference was not saved. Refresh the page to try again.",
        ),
      ).toHaveLength(2);
    });

    expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
  });

  it("clears previous save errors when saved opportunities is toggled again", async () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    fireEvent.click(screen.getByTestId("toggle-saved-opportunities"));

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await screen.findAllByText(
      "Your notification preference was not saved. Refresh the page to try again.",
    );

    fireEvent.click(screen.getByTestId("toggle-saved-opportunities"));

    expect(
      screen.queryAllByText(
        "Your notification preference was not saved. Refresh the page to try again.",
      ),
    ).toHaveLength(0);
  });

  it("renders one organization section per organization", () => {
    render(<NotificationsPageContent {...baseProps} />);

    expect(screen.getByTestId("org-section-1")).toBeInTheDocument();
    expect(screen.getByTestId("org-section-2")).toBeInTheDocument();
    expect(screen.getByText("Org One")).toBeInTheDocument();
    expect(screen.getByText("Org Two")).toBeInTheDocument();
  });

  it("toggles organization preferences locally without showing save error", () => {
    render(<NotificationsPageContent {...baseProps} />);

    expect(screen.getAllByText("unchecked")).toHaveLength(2);

    fireEvent.click(screen.getByTestId("org-toggle-1"));

    expect(screen.getByTestId("org-section-1")).toHaveTextContent("checked");
    expect(screen.getByTestId("org-section-2")).toHaveTextContent("unchecked");

    expect(
      screen.queryAllByText(
        "Your notification preference was not saved. Refresh the page to try again.",
      ),
    ).toHaveLength(0);
  });

  it("clears existing page-level and inline save errors when organization preference is toggled", async () => {
    render(<NotificationsPageContent {...baseProps} />);

    fireEvent.click(screen.getByTestId("toggle-saved-opportunities"));

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await screen.findAllByText(
      "Your notification preference was not saved. Refresh the page to try again.",
    );

    fireEvent.click(screen.getByTestId("org-toggle-1"));

    expect(
      screen.queryAllByText(
        "Your notification preference was not saved. Refresh the page to try again.",
      ),
    ).toHaveLength(0);
  });
});
