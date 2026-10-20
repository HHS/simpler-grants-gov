import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  ApiKeyAlert,
  ApiKeyAlertProvider,
} from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyAlertProvider";
import ApiKeyTableClient from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyTableClient";
import { CreateApiKeyButton } from "src/app/[locale]/(base)/developers/api-dashboard/_components/CreateApiKeyButton";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import {
  baseApiKey,
  createMockApiKey,
  usedApiKey,
} from "src/utils/testing/fixtures";

const mockClientFetch = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: jest.fn(),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: jest.fn(),
}));

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    refresh: mockRefresh,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

const mockUser = {
  isLoggedIn: true,
};

const mockApiKeys: ApiKey[] = [
  createMockApiKey({
    api_key_id: "key-1",
    key_name: "Production Key",
    created_at: "2025-01-15",
    last_used: "2025-02-01",
    is_active: true,
  }),
  createMockApiKey({
    api_key_id: "key-2",
    key_name: "Development Key",
    created_at: "2025-01-20",
    last_used: null,
    is_active: false,
  }),
];

const renderTable = (apiKeys: ApiKey[] = mockApiKeys) => {
  return render(<ApiKeyTableClient apiKeys={apiKeys} />);
};

const tableWithAlert = (apiKeys: ApiKey[]) => (
  <ApiKeyAlertProvider>
    <CreateApiKeyButton />
    <ApiKeyAlert />
    <ApiKeyTableClient apiKeys={apiKeys} />
  </ApiKeyAlertProvider>
);

const newApiKey = createMockApiKey({
  api_key_id: "key-new",
  key_name: "New Key",
  created_at: "2025-03-01",
});

const getModal = (mode: "edit" | "delete", apiKeyId: string) => {
  const modal = screen
    .getAllByRole("dialog", { hidden: true })
    .find((dialog) => dialog.id === `${mode}-api-key-${apiKeyId}`);
  if (!modal) throw new Error(`No ${mode} modal for ${apiKeyId}`);
  return modal;
};

const getDeleteModal = (apiKeyId: string) => getModal("delete", apiKeyId);
const getEditModal = (apiKeyId: string) => getModal("edit", apiKeyId);

describe("ApiKeyTableClient", () => {
  const mockUseClientFetch = jest.mocked(useClientFetch);
  const mockUseUser = jest.mocked(useUser);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoading: false,
      refreshUser: jest.fn(),
      hasBeenLoggedOut: false,
      logoutLocalUser: jest.fn(),
      resetHasBeenLoggedOut: jest.fn(),
      refreshIfExpired: jest.fn(),
      refreshIfExpiring: jest.fn(),
      featureFlags: {},
      userFeatureFlags: {},
      defaultFeatureFlags: {},
    });
    mockUseClientFetch.mockReturnValue({ clientFetch: mockClientFetch });
  });

  describe("Table Headers", () => {
    it("renders all four column headers", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(4);
      expect(headers[0]).toHaveTextContent("headers.keyName");
      expect(headers[1]).toHaveTextContent("headers.created");
      expect(headers[2]).toHaveTextContent("headers.lastUsed");
      expect(headers[3]).toHaveTextContent("headers.actions");
    });
  });

  describe("API Key Name Column", () => {
    it("renders API key names", () => {
      renderTable();

      expect(screen.getByText("Production Key")).toBeInTheDocument();
      expect(screen.getByText("Development Key")).toBeInTheDocument();
    });
  });

  describe("Date Columns", () => {
    it("renders created date", () => {
      renderTable();

      expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
      expect(screen.getByText("January 20, 2025")).toBeInTheDocument();
    });

    it("renders last used date when available", () => {
      renderTable([usedApiKey]);

      expect(screen.getByText("June 1, 2023")).toBeInTheDocument();
    });

    it('shows "never" when last_used is null', () => {
      renderTable([baseApiKey]);

      expect(screen.getByText("never")).toBeInTheDocument();
    });
  });

  describe("Actions Column", () => {
    it("renders a labeled edit name button for each API key", () => {
      renderTable();

      const editButtons = screen.getAllByTestId(
        /open-edit-api-key-modal-button-/,
      );
      expect(editButtons).toHaveLength(2);
      editButtons.forEach((button) => {
        expect(button).toHaveTextContent("editTriggerText");
        expect(within(button).getByText("editTriggerKeyName")).toHaveClass(
          "usa-sr-only",
        );
      });
    });

    it("renders a labeled, red delete button for each API key", () => {
      renderTable();

      const deleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      expect(deleteButtons).toHaveLength(2);
      deleteButtons.forEach((button) => {
        expect(button).toHaveTextContent("deleteTriggerText");
        expect(within(button).getByText("deleteTriggerKeyName")).toHaveClass(
          "usa-sr-only",
        );
        expect(button).toHaveClass("text-error-dark");
      });
    });
  });

  describe("Table Structure", () => {
    it("renders correct number of rows", () => {
      renderTable();

      // 1 header row + 2 data rows
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3);
    });

    it("handles a single API key", () => {
      renderTable([mockApiKeys[0]]);

      expect(screen.getByText("Production Key")).toBeInTheDocument();
      expect(screen.queryByText("Development Key")).not.toBeInTheDocument();

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(2);
    });
  });

  describe("Accessibility", () => {
    it("passes accessibility scan", async () => {
      const { container } = renderTable();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Deleting a key", () => {
    it("keeps each delete modal with its key when a new key is added at the top", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });
      const { rerender } = render(tableWithAlert(mockApiKeys));

      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-key-1"),
      );
      await user.type(
        within(getDeleteModal("key-1")).getByLabelText(
          "deleteConfirmationLabel",
        ),
        "del",
      );

      // keys come back newest first, so a newly created key takes the first row
      rerender(tableWithAlert([newApiKey, ...mockApiKeys]));

      expect(
        within(getDeleteModal("key-1")).getByLabelText(
          "deleteConfirmationLabel",
        ),
      ).toHaveValue("del");
      expect(
        within(getDeleteModal("key-new")).getByLabelText(
          "deleteConfirmationLabel",
        ),
      ).toHaveValue("");

      await user.click(
        within(getDeleteModal("key-1")).getByRole("button", { name: "cancel" }),
      );
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-key-new"),
      );
      const newKeyModal = getDeleteModal("key-new");
      await user.type(
        within(newKeyModal).getByLabelText("deleteConfirmationLabel"),
        "delete",
      );
      await user.click(
        within(newKeyModal).getByTestId("delete-api-key-submit-button"),
      );

      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalledWith(
          "/api/user/api-keys/key-new",
          expect.objectContaining({ method: "DELETE" }),
        );
      });
      expect(mockClientFetch).toHaveBeenCalledTimes(1);
    });

    it("shows the deleted key alert and refreshes the page after deleting", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });
      render(tableWithAlert(mockApiKeys));

      expect(screen.queryByTestId("api-key-alert")).not.toBeInTheDocument();

      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-key-2"),
      );
      const modal = getDeleteModal("key-2");
      await user.type(
        within(modal).getByLabelText("deleteConfirmationLabel"),
        "delete",
      );
      await user.click(
        within(modal).getByTestId("delete-api-key-submit-button"),
      );

      expect(await screen.findByTestId("api-key-alert")).toHaveTextContent(
        "deleteSuccessMessage",
      );
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(modal).toHaveClass("is-hidden");
    });

    it.each([
      ["create", "open-create-api-key-modal-button"],
      ["edit", "open-edit-api-key-modal-button-key-1"],
      ["delete", "open-delete-api-key-modal-button-key-1"],
    ])(
      "removes the deleted key alert when a %s modal is opened",
      async (_mode, openButtonTestId) => {
        const user = userEvent.setup();
        mockClientFetch.mockResolvedValue({ message: "Success" });
        render(tableWithAlert(mockApiKeys));

        await user.click(
          screen.getByTestId("open-delete-api-key-modal-button-key-2"),
        );
        const modal = getDeleteModal("key-2");
        await user.type(
          within(modal).getByLabelText("deleteConfirmationLabel"),
          "delete",
        );
        await user.click(
          within(modal).getByTestId("delete-api-key-submit-button"),
        );
        await screen.findByTestId("api-key-alert");

        await user.click(screen.getByTestId(openButtonTestId));

        await waitFor(() => {
          expect(screen.queryByTestId("api-key-alert")).not.toBeInTheDocument();
        });
      },
    );
  });
  describe("Renaming a key", () => {
    const renameKey = async (
      user: ReturnType<typeof userEvent.setup>,
      apiKeyId: string,
      newName: string,
    ) => {
      await user.click(
        screen.getByTestId(`open-edit-api-key-modal-button-${apiKeyId}`),
      );
      const modal = getEditModal(apiKeyId);
      const nameInput = within(modal).getByLabelText("apiKeyNameLabel");
      await user.clear(nameInput);
      await user.type(nameInput, newName);
      await user.click(within(modal).getByTestId("edit-api-key-submit-button"));
      return modal;
    };

    it("shows the renamed key alert and refreshes the page after renaming", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({
        data: { ...mockApiKeys[0], key_name: "Production v2" },
      });
      render(tableWithAlert(mockApiKeys));

      const modal = await renameKey(user, "key-1", "Production v2");

      expect(await screen.findByTestId("api-key-alert")).toHaveTextContent(
        "renameSuccessMessage",
      );
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(modal).toHaveClass("is-hidden");
    });

    it("replaces the deleted key alert rather than stacking", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValueOnce({ message: "Success" });
      render(tableWithAlert(mockApiKeys));

      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-key-2"),
      );
      const deleteModal = getDeleteModal("key-2");
      await user.type(
        within(deleteModal).getByLabelText("deleteConfirmationLabel"),
        "delete",
      );
      await user.click(
        within(deleteModal).getByTestId("delete-api-key-submit-button"),
      );
      expect(await screen.findByTestId("api-key-alert")).toHaveTextContent(
        "deleteSuccessMessage",
      );

      mockClientFetch.mockResolvedValueOnce({
        data: { ...mockApiKeys[0], key_name: "Production v2" },
      });
      await renameKey(user, "key-1", "Production v2");

      await waitFor(() => {
        expect(screen.getByTestId("api-key-alert")).toHaveTextContent(
          "renameSuccessMessage",
        );
      });
      expect(screen.getAllByTestId("api-key-alert")).toHaveLength(1);
    });

    it("shows each key's own name when a new key is added at the top", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({
        data: { ...newApiKey, key_name: "New Key v2" },
      });
      const { rerender } = render(tableWithAlert(mockApiKeys));

      // keys come back newest first, so a newly created key takes the first row
      rerender(tableWithAlert([newApiKey, ...mockApiKeys]));

      expect(
        within(getEditModal("key-new")).getByLabelText("apiKeyNameLabel"),
      ).toHaveValue("New Key");
      expect(
        within(getEditModal("key-1")).getByLabelText("apiKeyNameLabel"),
      ).toHaveValue("Production Key");

      await renameKey(user, "key-new", "New Key v2");

      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalledWith(
          "/api/user/api-keys/key-new",
          expect.objectContaining({ method: "PUT" }),
        );
      });
    });
  });
});
