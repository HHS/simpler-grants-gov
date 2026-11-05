import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateNotificationPreferenceActionState } from "src/app/[locale]/(base)/notifications/actions";

import {
  NotificationsPageContent,
  NotificationsPageContentProps,
} from "./NotificationsPageContent";

const mockUpdateSavedOpportunityNotificationPreferenceAction = jest.fn<
  Promise<UpdateNotificationPreferenceActionState>,
  [{ organizationId: string | null; emailEnabled: boolean }]
>();
const mockUpdateAllOpportunitiesNotificationPreferenceAction = jest.fn<
  Promise<UpdateNotificationPreferenceActionState>,
  [{ isEnabled: boolean }]
>();

jest.mock("src/app/[locale]/(base)/notifications/actions", () => ({
  updateSavedOpportunityNotificationPreferenceAction: (props: {
    organizationId: string | null;
    emailEnabled: boolean;
  }) => mockUpdateSavedOpportunityNotificationPreferenceAction(props),
  updateAllOpportunitiesNotificationPreferenceAction: (props: {
    isEnabled: boolean;
  }) => mockUpdateAllOpportunitiesNotificationPreferenceAction(props),
}));

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <span role="progressbar" aria-label="Loading!" />,
}));

const SAVE_ERROR = "preferencesNotSavedError";

const baseProps: NotificationsPageContentProps = {
  pageHeading: "Notifications",
  fetchErrorMessage: "fetchError",
  managePreferencesTitle: "Manage your preferences",
  managePreferencesDescription: "managePreferencesDescription",
  organizationPreferencesTitle: "Organization preferences",
  organizationPreferencesDescription: "organizationPreferencesDescription",
  savedOpportunitiesLabel: "Subscribe to saved opportunities",
  savedOpportunitiesDescription: "savedOpportunitiesDescription",
  allNewOpportunitiesLabel: "Subscribe to all new opportunities",
  allNewOpportunitiesDescription: "allNewOpportunitiesDescription",
  organizationSavedOpportunitiesDescription:
    "organizationSavedOpportunitiesDescription",
  organizations: [],
  hasOrganizationsFetchError: false,
  initialPreferenceValues: {
    "saved-opportunities": false,
    "all-new-opportunities": false,
  },
};

const getAllNewOpportunitiesCheckbox = () =>
  screen.getByRole("checkbox", { name: "Subscribe to all new opportunities" });

const getSavedOpportunitiesCheckbox = () =>
  screen.getByRole("checkbox", { name: "Subscribe to saved opportunities" });

describe("NotificationsPageContent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the fetch error when preferences could not be loaded", () => {
    render(
      <NotificationsPageContent {...baseProps} hasOrganizationsFetchError />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("fetchError");
  });

  describe("all new opportunities toggle", () => {
    it("renders under manage your preferences", () => {
      render(<NotificationsPageContent {...baseProps} />);

      const section = screen.getByRole("region", {
        name: "Manage your preferences",
      });

      expect(section).toContainElement(getAllNewOpportunitiesCheckbox());
      expect(
        screen.getByText("allNewOpportunitiesDescription"),
      ).toBeInTheDocument();
    });

    it.each([true, false])(
      "renders the initial preference value of %s",
      (isEnabled) => {
        render(
          <NotificationsPageContent
            {...baseProps}
            initialPreferenceValues={{
              ...baseProps.initialPreferenceValues,
              "all-new-opportunities": isEnabled,
            }}
          />,
        );

        expect(getAllNewOpportunitiesCheckbox()).toHaveProperty(
          "checked",
          isEnabled,
        );
      },
    );

    it("calls the all opportunities action and stays on when save succeeds", async () => {
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(<NotificationsPageContent {...baseProps} />);

      fireEvent.click(getAllNewOpportunitiesCheckbox());

      await waitFor(() => {
        expect(getAllNewOpportunitiesCheckbox()).toBeChecked();
      });

      expect(
        mockUpdateAllOpportunitiesNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ isEnabled: true });
      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).not.toHaveBeenCalled();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("stays off when turning off succeeds", async () => {
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          initialPreferenceValues={{
            ...baseProps.initialPreferenceValues,
            "all-new-opportunities": true,
          }}
        />,
      );

      fireEvent.click(getAllNewOpportunitiesCheckbox());

      await waitFor(() => {
        expect(getAllNewOpportunitiesCheckbox()).not.toBeChecked();
      });

      expect(
        mockUpdateAllOpportunitiesNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ isEnabled: false });
    });

    it("stays off and shows an error when turning on fails", async () => {
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue({
        success: false,
        error: SAVE_ERROR,
      });

      render(<NotificationsPageContent {...baseProps} />);

      fireEvent.click(getAllNewOpportunitiesCheckbox());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(SAVE_ERROR);
      });

      expect(getAllNewOpportunitiesCheckbox()).not.toBeChecked();
      expect(getAllNewOpportunitiesCheckbox()).toBeEnabled();
    });

    it("displays as on and shows an error when turning off fails", async () => {
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue({
        success: false,
        error: SAVE_ERROR,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          initialPreferenceValues={{
            ...baseProps.initialPreferenceValues,
            "all-new-opportunities": true,
          }}
        />,
      );

      expect(getAllNewOpportunitiesCheckbox()).toBeChecked();
      fireEvent.click(getAllNewOpportunitiesCheckbox());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(SAVE_ERROR);
      });

      expect(getAllNewOpportunitiesCheckbox()).toBeChecked();
    });

    it("falls back to the default error message when the action returns nothing", async () => {
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue(
        undefined,
      );

      render(<NotificationsPageContent {...baseProps} />);

      fireEvent.click(getAllNewOpportunitiesCheckbox());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Your notification preference was not saved. Refresh the page to try again.",
        );
      });

      expect(getAllNewOpportunitiesCheckbox()).not.toBeChecked();
    });
  });

  describe("saved opportunities toggles", () => {
    it("calls the saved opportunities action for the personal preference", async () => {
      mockUpdateSavedOpportunityNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(<NotificationsPageContent {...baseProps} />);

      fireEvent.click(getSavedOpportunitiesCheckbox());

      await waitFor(() => {
        expect(getSavedOpportunitiesCheckbox()).toBeChecked();
      });

      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ organizationId: null, emailEnabled: true });
      expect(
        mockUpdateAllOpportunitiesNotificationPreferenceAction,
      ).not.toHaveBeenCalled();
    });

    it("keeps the previous value when saving the personal preference fails", async () => {
      mockUpdateSavedOpportunityNotificationPreferenceAction.mockResolvedValue({
        success: false,
        error: SAVE_ERROR,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          initialPreferenceValues={{
            ...baseProps.initialPreferenceValues,
            "saved-opportunities": true,
          }}
        />,
      );

      fireEvent.click(getSavedOpportunitiesCheckbox());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(SAVE_ERROR);
      });

      expect(getSavedOpportunitiesCheckbox()).toBeChecked();
    });

    it("calls the saved opportunities action with the organization id", async () => {
      mockUpdateSavedOpportunityNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          organizations={[
            { organizationId: "org-1", organizationName: "Org One" },
          ]}
        />,
      );

      const organizationSection = screen.getByRole("region", {
        name: /Org One/,
      });
      const organizationCheckbox =
        within(organizationSection).getByRole("checkbox");

      fireEvent.click(organizationCheckbox);

      await waitFor(() => {
        expect(organizationCheckbox).toBeChecked();
      });

      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ organizationId: "org-1", emailEnabled: true });
    });
  });

  describe("keyboard interaction", () => {
    const organizations = [
      { organizationId: "org-1", organizationName: "Org One" },
    ];

    const getOrganizationCheckbox = () =>
      within(screen.getByRole("region", { name: /Org One/ })).getByRole(
        "checkbox",
      );

    it("moves focus through each checkbox in order with Tab", async () => {
      const user = userEvent.setup();

      render(
        <NotificationsPageContent
          {...baseProps}
          organizations={organizations}
        />,
      );

      await user.tab();
      expect(getSavedOpportunitiesCheckbox()).toHaveFocus();
      await user.tab();
      expect(getAllNewOpportunitiesCheckbox()).toHaveFocus();
      await user.tab();
      expect(getOrganizationCheckbox()).toHaveFocus();
    });

    it("turns the all new opportunities preference on with space", async () => {
      const user = userEvent.setup();
      mockUpdateAllOpportunitiesNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(<NotificationsPageContent {...baseProps} />);

      await user.tab();
      await user.tab();
      expect(getAllNewOpportunitiesCheckbox()).toHaveFocus();

      await user.keyboard(" ");
      await waitFor(() => {
        expect(getAllNewOpportunitiesCheckbox()).toBeChecked();
      });

      expect(
        mockUpdateAllOpportunitiesNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ isEnabled: true });
    });

    it("toggles personal saved opportunities preference off with space", async () => {
      const user = userEvent.setup();
      mockUpdateSavedOpportunityNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          initialPreferenceValues={{
            ...baseProps.initialPreferenceValues,
            "saved-opportunities": true,
          }}
        />,
      );

      await user.tab();
      expect(getSavedOpportunitiesCheckbox()).toHaveFocus();

      await user.keyboard(" ");

      await waitFor(() => {
        expect(getSavedOpportunitiesCheckbox()).not.toBeChecked();
      });

      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ organizationId: null, emailEnabled: false });
    });

    it("turns an organization preference off with space", async () => {
      const user = userEvent.setup();
      mockUpdateSavedOpportunityNotificationPreferenceAction.mockResolvedValue({
        success: true,
        error: null,
      });

      render(
        <NotificationsPageContent
          {...baseProps}
          organizations={organizations}
          initialPreferenceValues={{
            ...baseProps.initialPreferenceValues,
            "organization-org-1-saved-opportunities": true,
          }}
        />,
      );

      await user.tab();
      await user.tab();
      await user.tab();
      expect(getOrganizationCheckbox()).toHaveFocus();

      await user.keyboard(" ");

      await waitFor(() => {
        expect(getOrganizationCheckbox()).not.toBeChecked();
      });

      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).toHaveBeenCalledWith({ organizationId: "org-1", emailEnabled: false });
    });

    it("does not toggle a checkbox when Enter is pressed", async () => {
      const user = userEvent.setup();

      render(<NotificationsPageContent {...baseProps} />);

      await user.tab();
      expect(getSavedOpportunitiesCheckbox()).toHaveFocus();

      await user.keyboard("{Enter}");

      expect(getSavedOpportunitiesCheckbox()).not.toBeChecked();
      expect(
        mockUpdateSavedOpportunityNotificationPreferenceAction,
      ).not.toHaveBeenCalled();
    });
  });
});
