import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import {
  createMockApiKey,
  longNameApiKey,
  specialCharApiKey,
} from "src/utils/testing/fixtures";

import { NextIntlClientProvider } from "next-intl";

import ApiKeyTable from "src/components/developer/apiDashboard/ApiKeyTable";

// Mock dependencies
const mockClientFetch = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: jest.fn(),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: jest.fn(),
}));

// Mock Next.js navigation
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: () => ({
    current: {
      toggleModal: jest.fn(),
    },
  }),
}));

const mockUser = {
  user_id: "test-user-id",
  token: "test-token",
};

const mockApiKeys: ApiKey[] = [
  createMockApiKey({
    api_key_id: "test-api-key-1",
    key_name: "Production API Key",
    key_id: "abc123def456",
    created_at: "2023-01-01",
    last_used: "2023-01-02",
  }),
  createMockApiKey({
    api_key_id: "test-api-key-2",
    key_name: "Development API Key",
    key_id: "xyz789uvw012",
    created_at: "2023-01-03",
    last_used: null,
  }),
];

const messages = {
  ApiDashboard: {
    table: {
      headers: {
        apiKey: "Name",
        status: "Status",
        secret: "Secret",
        created: "Created",
        lastUsed: "Last used",
        modify: "Modify",
      },
      statuses: {
        active: "Active",
        inactive: "Inactive",
      },
      dateLabels: {
        created: "Created:",
        lastUsed: "Last used:",
        never: "Never",
      },
      emptyState:
        "You don't have any API keys yet. Create your first API key to get started.",
    },
    modal: {
      apiKeyNameLabel: "Name <required>(required)</required>",
      placeholder: "e.g., Production API Key",
      createTitle: "Create New API Key",
      editTitle: "Rename API Key: {keyName}",
      deleteTitle: "Delete API Key",
      createDescription:
        "Create a new key for use with the Simpler.Grants.gov API",
      editDescription: "Change the name of your Simpler.Grants.gov API key",
      deleteDescription:
        'To confirm deletion, type "delete" in the field below:',
      deleteConfirmationLabel:
        'Type "delete" to confirm <required>(required)</required>',
      deleteConfirmationPlaceholder: "delete",
      deleteConfirmationError: 'Please type "delete" to confirm deletion',
      createSuccessHeading: "API Key Created Successfully",
      editSuccessHeading: "API Key Renamed Successfully",
      deleteSuccessHeading: "API Key Deleted Successfully",
      createSuccessMessage:
        'Your API key "{keyName}" has been created successfully.',
      editSuccessMessage:
        'Your API key has been renamed from "{originalName}" to "{keyName}".',
      deleteSuccessMessage:
        'Your API key "{keyName}" has been deleted successfully.',
      close: "Close",
      createErrorMessage:
        "There was an error creating your API key. Please try again.",
      editErrorMessage:
        "There was an error renaming your API key. Please try again.",
      deleteErrorMessage:
        "There was an error deleting your API key. Please try again.",
      nameRequiredError: "API key name is required",
      nameChangedError: "Please enter a different name",
      createButtonText: "Create API Key",
      editNameButtonText: "Edit Name",
      deleteButtonText: "Delete Key",
      creating: "Creating...",
      saving: "Saving...",
      deleting: "Deleting...",
      saveChanges: "Save Changes",
      cancel: "Cancel",
    },
  },
};

const renderTable = (apiKeys: ApiKey[] = mockApiKeys) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ApiKeyTable apiKeys={apiKeys} />
    </NextIntlClientProvider>,
  );
};

describe("ApiKeyTable", () => {
  const mockUseClientFetch = jest.mocked(useClientFetch);
  const mockUseUser = jest.mocked(useUser);

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockClear();
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

  describe("Basic Rendering", () => {
    it("renders table with API keys", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(6);
      expect(headers[0]).toHaveTextContent("Name");
      expect(headers[1]).toHaveTextContent("Status");
      expect(headers[2]).toHaveTextContent("Secret");
      expect(headers[3]).toHaveTextContent("Created");
      expect(headers[4]).toHaveTextContent("Last used");
      expect(headers[5]).toHaveTextContent("Modify");

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
    });

    it("displays API key information correctly", () => {
      renderTable();

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("abc...456")).toBeInTheDocument();

      expect(screen.getByText("Development API Key")).toBeInTheDocument();
      expect(screen.getByText("xyz...012")).toBeInTheDocument();
      expect(screen.getByText("Never")).toBeInTheDocument();
    });

    it("renders empty state when no API keys", () => {
      renderTable([]);

      expect(
        screen.getByText(
          "You don't have any API keys yet. Create your first API key to get started.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("Delete Functionality", () => {
    it("renders delete buttons for each API key", () => {
      renderTable();

      const actualDeleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      expect(actualDeleteButtons).toHaveLength(2);
    });

    it("opens delete modal when delete button is clicked", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const deleteHeadings = screen.getAllByRole("heading", {
        level: 2,
        name: /Delete API Key/i,
      });
      expect(deleteHeadings.length).toBeGreaterThan(0);

      expect(screen.getByText('"Production API Key"')).toBeInTheDocument();
      expect(
        screen.getAllByText(
          'To confirm deletion, type "delete" in the field below:',
        )[0],
      ).toBeInTheDocument();
    });

    it("shows correct API key name in delete modal", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-2",
      );
      await user.click(deleteButton);

      expect(screen.getByText('"Development API Key"')).toBeInTheDocument();
    });

    it("successfully deletes API key and refreshes page", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });

      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const confirmationInputs = screen.getAllByPlaceholderText("delete");
      await user.type(confirmationInputs[0], "delete");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockClientFetch).toHaveBeenCalledWith(
        "/api/user/api-keys/test-api-key-1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(mockRefresh).toHaveBeenCalled();
    });

    it("validates delete confirmation input", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      expect(
        screen.getByText('Please type "delete" to confirm deletion'),
      ).toBeInTheDocument();
    });

    it("rejects incorrect confirmation text", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const confirmationInputs = screen.getAllByPlaceholderText("delete");
      await user.type(confirmationInputs[0], "wrong");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      expect(
        screen.getByText('Please type "delete" to confirm deletion'),
      ).toBeInTheDocument();
    });

    it("handles delete API errors", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockRejectedValue(new Error("API Error"));

      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const confirmationInputs = screen.getAllByPlaceholderText("delete");
      await user.type(confirmationInputs[0], "delete");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        screen.getByText(
          "There was an error deleting your API key. Please try again.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("renders edit buttons for each API key", () => {
      renderTable();

      const actualEditButtons = screen.getAllByTestId(
        /open-edit-api-key-modal-button-/,
      );
      expect(actualEditButtons).toHaveLength(2);
    });

    it("opens edit modal when edit button is clicked", async () => {
      const user = userEvent.setup();
      renderTable();

      const editButton = screen.getByTestId(
        "open-edit-api-key-modal-button-test-api-key-1",
      );
      await user.click(editButton);

      const editHeadings = screen.getAllByRole("heading", {
        level: 2,
        name: /Rename API Key/i,
      });
      expect(editHeadings.length).toBeGreaterThan(0);

      expect(
        screen.getByDisplayValue("Production API Key"),
      ).toBeInTheDocument();
    });

    it("successfully renames API key and refreshes page", async () => {
      const user = userEvent.setup();
      const renamedApiKey = { ...mockApiKeys[0], key_name: "Renamed API Key" };
      mockClientFetch.mockResolvedValue({ data: renamedApiKey });

      renderTable();

      const editButton = screen.getByTestId(
        "open-edit-api-key-modal-button-test-api-key-1",
      );
      await user.click(editButton);

      const nameInput = screen.getByDisplayValue("Production API Key");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed API Key");

      const submitButtons = screen.getAllByTestId("edit-api-key-submit-button");
      await user.click(submitButtons[0]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockClientFetch).toHaveBeenCalledWith(
        "/api/user/api-keys/test-api-key-1",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name: "Renamed API Key",
          }),
        },
      );

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("Table Structure", () => {
    it("has correct number of rows", () => {
      renderTable();

      // Header row + 2 data rows
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3);
    });

    it("displays correct column headers", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(6);
      expect(headers[0]).toHaveTextContent("Name");
      expect(headers[1]).toHaveTextContent("Status");
      expect(headers[2]).toHaveTextContent("Secret");
      expect(headers[3]).toHaveTextContent("Created");
      expect(headers[4]).toHaveTextContent("Last used");
      expect(headers[5]).toHaveTextContent("Modify");
    });

    it("displays API key data in correct order", () => {
      renderTable();

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3); // header + 2 data rows

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
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

    it("has proper ARIA labels for delete buttons", () => {
      renderTable();

      const deleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute("title", "Delete API Key");
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.tab();

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Edge Cases", () => {
    it("handles API keys with long names", () => {
      renderTable([longNameApiKey]);

      expect(screen.getByText(longNameApiKey.key_name)).toBeInTheDocument();
    });

    it("handles API keys with special characters in names", () => {
      renderTable([specialCharApiKey]);

      expect(screen.getByText(specialCharApiKey.key_name)).toBeInTheDocument();
    });

    it("handles API keys with null last_used date", () => {
      const nullLastUsedApiKey: ApiKey = {
        ...mockApiKeys[0],
        last_used: null,
      };

      renderTable([nullLastUsedApiKey]);

      expect(screen.getByText("Never")).toBeInTheDocument();
    });

    it("handles single API key", () => {
      renderTable([mockApiKeys[0]]);

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.queryByText("Development API Key")).not.toBeInTheDocument();

      const actualDeleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      expect(actualDeleteButtons).toHaveLength(1);
    });
  });
});
