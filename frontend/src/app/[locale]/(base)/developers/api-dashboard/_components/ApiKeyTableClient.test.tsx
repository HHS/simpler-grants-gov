import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ApiKeyTableClient from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyTableClient";
import { CreateApiKeyButton } from "src/app/[locale]/(base)/developers/api-dashboard/_components/CreateApiKeyButton";
import {
  ApiKeyAlert,
  ApiKeyAlertProvider,
} from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyAlertProvider";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import {
  baseApiKey,
  createMockApiKey,
  inactiveApiKey,
  usedApiKey,
} from "src/utils/testing/fixtures";

const mockClientFetch = jest.fn();
const mockWriteText = jest.fn(() => Promise.resolve());

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

Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

const mockUser = {
  user_id: "test-user-id",
  token: "test-token",
};

const mockApiKeys: ApiKey[] = [
  createMockApiKey({
    api_key_id: "key-1",
    key_name: "Production Key",
    key_id: "abc123def456",
    created_at: "2025-01-15",
    last_used: "2025-02-01",
    is_active: true,
  }),
  createMockApiKey({
    api_key_id: "key-2",
    key_name: "Development Key",
    key_id: "xyz789uvw012",
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
  key_id: "new123new456",
  created_at: "2025-03-01",
});

const getDeleteModal = (apiKeyId: string) => {
  const modal = screen
    .getAllByRole("dialog", { hidden: true })
    .find((dialog) => dialog.id === `delete-api-key-${apiKeyId}`);
  if (!modal) throw new Error(`No delete modal for ${apiKeyId}`);
  return modal;
};

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
    it("renders all six column headers", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(6);
      expect(headers[0]).toHaveTextContent("headers.apiKey");
      expect(headers[1]).toHaveTextContent("headers.status");
      expect(headers[2]).toHaveTextContent("headers.secret");
      expect(headers[3]).toHaveTextContent("headers.created");
      expect(headers[4]).toHaveTextContent("headers.lastUsed");
      expect(headers[5]).toHaveTextContent("headers.modify");
    });
  });

  describe("API Key Name Column", () => {
    it("renders API key names", () => {
      renderTable();

      expect(screen.getByText("Production Key")).toBeInTheDocument();
      expect(screen.getByText("Development Key")).toBeInTheDocument();
    });
  });

  describe("Status Column", () => {
    it("shows active status for active keys", () => {
      renderTable([baseApiKey]);

      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("shows inactive status for inactive keys", () => {
      renderTable([inactiveApiKey]);

      expect(screen.getByText("inactive")).toBeInTheDocument();
    });
  });

  describe("Secret Column", () => {
    it("renders truncated key_id with ellipsis", () => {
      renderTable();

      expect(screen.getByText("abc...456")).toBeInTheDocument();
      expect(screen.getByText("xyz...012")).toBeInTheDocument();
    });

    it("renders copy icons for each API key", () => {
      renderTable();

      const copyButtons = screen.getAllByRole("button", {
        name: "copyApiKey",
      });
      expect(copyButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Date Columns", () => {
    it("renders created date", () => {
      renderTable();

      expect(screen.getByText("Jan 15, 2025")).toBeInTheDocument();
      expect(screen.getByText("Jan 20, 2025")).toBeInTheDocument();
    });

    it("renders last used date when available", () => {
      renderTable([usedApiKey]);

      expect(screen.getByText("Jun 1, 2023")).toBeInTheDocument();
    });

    it('shows "never" when last_used is null', () => {
      renderTable([baseApiKey]);

      expect(screen.getByText("never")).toBeInTheDocument();
    });
  });

  describe("Modify Column", () => {
    it("renders edit buttons for each API key", () => {
      renderTable();

      const editButtons = screen.getAllByTestId(
        /open-edit-api-key-modal-button-/,
      );
      expect(editButtons).toHaveLength(2);
    });

    it("renders delete buttons for each API key", () => {
      renderTable();

      const deleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      expect(deleteButtons).toHaveLength(2);
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

      const results = await axe(container, {
        rules: {
          // CopyIcon and edit icon buttons are icon-only; a11y labels are a
          // pre-existing concern tracked separately from this test file.
          "button-name": { enabled: false },
        },
      });
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

      expect(
        screen.queryByTestId("api-key-alert"),
      ).not.toBeInTheDocument();

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

      expect(
        await screen.findByTestId("api-key-alert"),
      ).toHaveTextContent("deleteSuccessMessage");
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
          expect(
            screen.queryByTestId("api-key-alert"),
          ).not.toBeInTheDocument();
        });
      },
    );
  });
});
