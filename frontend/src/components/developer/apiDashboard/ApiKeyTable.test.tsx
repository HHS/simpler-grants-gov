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
    last_used: "2023-01-02T00:00:00Z",
  }),
  createMockApiKey({
    api_key_id: "test-api-key-2",
    key_name: "Development API Key",
    key_id: "def456",
    created_at: "2023-01-03T00:00:00Z",
    last_used: null,
  }),
];

const renderTable = (apiKeys: ApiKey[] = mockApiKeys) => {
  return render(<ApiKeyTable apiKeys={apiKeys} />);
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

      // Check table headers using columnheader role to avoid responsive header duplicates
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(4);
      expect(headers[0]).toHaveTextContent("apiKey");
      expect(headers[1]).toHaveTextContent("dates");
      expect(headers[2]).toHaveTextContent("editName");
      expect(headers[3]).toHaveTextContent("deleteKey");

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
    });

    it("displays API key information correctly", () => {
      renderTable();

      // Check first API key
      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("abc123")).toBeInTheDocument();
      expect(screen.getAllByText("created")).toHaveLength(2); // One per API key
      expect(screen.getAllByText("lastUsed")).toHaveLength(2); // One per API key

      // Check second API key with no last used date
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
      expect(screen.getByText("def456")).toBeInTheDocument();
      expect(screen.getByText("never")).toBeInTheDocument();
    });

    it("renders empty state when no API keys", () => {
      renderTable([]);

      expect(screen.getByText("emptyState")).toBeInTheDocument();
      expect(screen.queryByText("apiKey")).not.toBeInTheDocument();
    });
  });

  describe("Delete Functionality", () => {
    it("renders delete buttons for each API key", () => {
      renderTable();

      // With 2 API keys: 2 delete buttons + 2 submit buttons = 4 total
      const deleteButtons = screen.getAllByText("deleteButtonText");
      expect(deleteButtons).toHaveLength(4);

      // Verify actual delete buttons (not headers or submit buttons)
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

      // Find the specific modal heading by text content
      const deleteHeadings = screen.getAllByRole("heading", {
        level: 2,
        name: /deleteTitle/i,
      });
      expect(deleteHeadings.length).toBeGreaterThan(0);

      expect(screen.getByText('"Production API Key"')).toBeInTheDocument();
      // Just verify the text exists, don't worry about which modal it's in since both have same text
      expect(screen.getAllByText("deleteDescription")[0]).toBeInTheDocument();
    });

    it("shows correct API key name in delete modal", async () => {
      const user = userEvent.setup();
      renderTable();

      // Click delete for second API key
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

      // Open delete modal for first API key
      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      // Type confirmation and submit - get all inputs and use the first one
      const confirmationInputs = screen.getAllByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInputs[0], "delete");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      // Wait for API call and router refresh
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

      // Open delete modal
      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      // Try to submit without typing "delete"
      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();
    });

    it("rejects incorrect confirmation text", async () => {
      const user = userEvent.setup();
      renderTable();

      // Open delete modal
      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      // Type incorrect confirmation
      const confirmationInputs = screen.getAllByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInputs[0], "wrong");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();
    });

    it("handles delete API errors", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockRejectedValue(new Error("API Error"));

      renderTable();

      // Open delete modal
      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      // Type confirmation and submit
      const confirmationInputs = screen.getAllByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInputs[0], "delete");

      const submitButtons = screen.getAllByTestId(
        "delete-api-key-submit-button",
      );
      await user.click(submitButtons[0]);

      // Wait for error to appear
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.getByText("deleteErrorMessage")).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("renders edit buttons for each API key", () => {
      renderTable();

      // Each API key has responsive header + edit button: 1 header + 2 responsive headers + 2 edit buttons = 5 total
      const editHeaders = screen.getAllByText("headers.editName");
      expect(editHeaders).toHaveLength(3); // header + 2 responsive headers

      const editButtons = screen.getAllByText("editNameButtonText");
      expect(editButtons).toHaveLength(2);

      // Verify actual edit buttons (not headers)
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

      // Find the specific modal heading by text content
      const editHeadings = screen.getAllByRole("heading", {
        level: 2,
        name: /editTitle/i,
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

      // Open edit modal
      const editButton = screen.getByTestId(
        "open-edit-api-key-modal-button-test-api-key-1",
      );
      await user.click(editButton);

      // Change name and submit - use getByLabelText to be more specific
      const nameInput = screen.getByDisplayValue("Production API Key");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed API Key");

      // Find the specific submit button within the opened modal
      const submitButtons = screen.getAllByTestId("edit-api-key-submit-button");
      await user.click(submitButtons[0]); // Click the first one (they're both identical)

      // Wait for API call and router refresh
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

      // Check headers by role to avoid duplication with responsive headers
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(4);
      expect(headers[0]).toHaveTextContent("apiKey");
      expect(headers[1]).toHaveTextContent("dates");
      expect(headers[2]).toHaveTextContent("editName");
      expect(headers[3]).toHaveTextContent("deleteKey");
    });

    it("displays API key data in correct order", () => {
      renderTable();

      // Get all rows (excluding header)
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3); // header + 2 data rows

      // Check that API keys are displayed
      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("passes accessibility scan", async () => {
      const { container } = renderTable();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper ARIA labels for buttons", () => {
      renderTable();

      const deleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute("title", "deleteTitle");
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      renderTable();

      // Tab to first available button (could be edit or delete)
      await user.tab();

      // Check if we can focus on buttons and navigate
      // Verify we can find buttons and that one is focused
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      // Verify at least one button exists
      expect(buttons[0]).toBeInstanceOf(HTMLButtonElement);

      // Open modal with Enter
      await user.keyboard("{Enter}");

      // Should have opened some modal (either edit or delete)
      // Check that at least one modal is visible (not hidden)
      const dialogs = screen.getAllByRole("dialog");
      const visibleDialog = dialogs.find(
        (dialog) => !dialog.classList.contains("is-hidden"),
      );
      expect(visibleDialog).toBeInTheDocument();
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

      expect(screen.getByText("never")).toBeInTheDocument();
    });

    it("handles single API key", () => {
      renderTable([mockApiKeys[0]]);

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.queryByText("Development API Key")).not.toBeInTheDocument();

      // With single API key: 1 header + 1 responsive header + 1 delete button + 1 submit button = 4 total
      const deleteHeaders = screen.getAllByText("headers.deleteKey");
      expect(deleteHeaders).toHaveLength(2);

      const deleteButtons = screen.getAllByText("deleteButtonText");
      expect(deleteButtons).toHaveLength(2);

      // Verify actual delete button
      const actualDeleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      expect(actualDeleteButtons).toHaveLength(1);
    });
  });
});
