import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { NotificationsPageContent } from "./NotificationsPageContent";

type NotificationPreferenceCardProps = {
  onCheckedChange: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
};

jest.mock("./NotificationPreferenceCard", () => ({
  NotificationPreferenceCard: ({
    onCheckedChange,
    isDisabled,
    isLoading,
    hasError,
  }: NotificationPreferenceCardProps) => (
    <div>
      <button
        onClick={onCheckedChange}
        disabled={isDisabled}
        data-testid="saved-opportunities-toggle"
      >
        toggle
      </button>
      {isLoading && <span>loading</span>}
      {hasError && <span>error</span>}
    </div>
  ),
}));

type Organization = {
  name: string;
  organizationId: string;
};

type OrganizationPreferenceSectionProps = {
  organization: Organization;
  onCheckedChange: () => void;
};

jest.mock("./OrganizationPreferenceSection", () => ({
  OrganizationPreferenceSection: ({
    organization,
    onCheckedChange,
  }: OrganizationPreferenceSectionProps) => (
    <div>
      <span>{organization.name}</span>
      <button
        onClick={onCheckedChange}
        data-testid={`org-toggle-${organization.organizationId}`}
      >
        toggle
      </button>
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
      { organizationId: "1", name: "Org One" },
      { organizationId: "2", name: "Org Two" },
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

  it("does not render organization section if empty", () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    expect(
      screen.queryByText("Organization Preferences"),
    ).not.toBeInTheDocument();
  });

  it("handles saved opportunities toggle with loading and error", async () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    const toggle = screen.getByTestId("saved-opportunities-toggle");

    fireEvent.click(toggle);

    expect(screen.getByText("loading")).toBeInTheDocument();
    jest.advanceTimersByTime(1200);

    await waitFor(() => {
      expect(screen.getByText(/not saved/i)).toBeInTheDocument();
    });

    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("clears previous errors when toggling again", async () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);

    const toggle = screen.getByTestId("saved-opportunities-toggle");

    fireEvent.click(toggle);
    jest.advanceTimersByTime(1200);

    await screen.findByText(/not saved/i);
    fireEvent.click(toggle);

    expect(screen.queryByText(/not saved/i)).not.toBeInTheDocument();
  });

  it("clears page-level error when toggling organization preference", async () => {
    render(<NotificationsPageContent {...baseProps} organizations={[]} />);
    const mainToggle = screen.getByTestId("saved-opportunities-toggle");

    fireEvent.click(mainToggle);
    jest.advanceTimersByTime(1200);
    await screen.findByText(/not saved/i);

    expect(
      screen.getByText(/Your notification preference was not saved/i),
    ).toBeInTheDocument();
  });
});
