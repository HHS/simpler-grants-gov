import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ApiKeyTable from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyTable";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import {
  createMockApiKey,
  longNameApiKey,
  specialCharApiKey,
} from "src/utils/testing/fixtures";

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

const mockUser = {
  isLoggedIn: true,
};

const mockApiKeys: ApiKey[] = [
  createMockApiKey({
    api_key_id: "test-api-key-1",
    key_name: "Production API Key",
    created_at: "2023-01-01",
    last_used: "2023-01-02",
  }),
  createMockApiKey({
    api_key_id: "test-api-key-2",
    key_name: "Development API Key",
    created_at: "2023-01-03",
    last_used: null,
  }),
];

// every row renders its modals, and jsdom has no USWDS styles to hide the closed ones
const getOpenModal = () => {
  const openModal = screen
    .getAllByRole("dialog")
    .find((dialog) => dialog.classList.contains("is-visible"));
  if (!openModal) throw new Error("No open modal found");
  return openModal;
};

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

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(4);
      expect(headers[0]).toHaveTextContent("headers.keyName");
      expect(headers[1]).toHaveTextContent("headers.created");
      expect(headers[2]).toHaveTextContent("headers.lastUsed");
      expect(headers[3]).toHaveTextContent("headers.actions");

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("Development API Key")).toBeInTheDocument();
    });

    it("displays API key information correctly", () => {
      renderTable();

      expect(screen.getByText("Production API Key")).toBeInTheDocument();
      expect(screen.getByText("January 1, 2023")).toBeInTheDocument();
      expect(screen.getByText("January 2, 2023")).toBeInTheDocument();

      expect(screen.getByText("Development API Key")).toBeInTheDocument();
      expect(screen.getByText("January 3, 2023")).toBeInTheDocument();
      expect(screen.getByText("never")).toBeInTheDocument();
    });

    it("renders empty state when no API keys", () => {
      renderTable([]);

      expect(
        screen.getByRole("heading", { level: 2, name: "emptyStateHeading" }),
      ).toBeInTheDocument();
      expect(screen.getByText("emptyStateDescription")).toBeInTheDocument();
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

      const modal = getOpenModal();
      expect(
        within(modal).getByRole("heading", { level: 2, name: "deleteTitle" }),
      ).toBeInTheDocument();
      expect(within(modal).getByText("deleteDescription")).toBeInTheDocument();
    });

    it("opens the delete modal for the selected key", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-2",
      );
      await user.click(deleteButton);

      expect(getOpenModal()).toHaveAttribute(
        "id",
        "delete-api-key-test-api-key-2",
      );
    });

    it("successfully deletes API key and refreshes page", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });

      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const modal = getOpenModal();
      await user.type(
        within(modal).getByLabelText("deleteConfirmationLabel"),
        "delete",
      );
      await user.click(
        within(modal).getByTestId("delete-api-key-submit-button"),
      );

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

      expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();
    });

    it("rejects incorrect confirmation text", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      await user.type(
        within(getOpenModal()).getByLabelText("deleteConfirmationLabel"),
        "wrong",
      );

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

      const deleteButton = screen.getByTestId(
        "open-delete-api-key-modal-button-test-api-key-1",
      );
      await user.click(deleteButton);

      const modal = getOpenModal();
      await user.type(
        within(modal).getByLabelText("deleteConfirmationLabel"),
        "delete",
      );
      await user.click(
        within(modal).getByTestId("delete-api-key-submit-button"),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.getByText("deleteErrorHeading")).toBeInTheDocument();
      expect(screen.getByText("deleteErrorMessage")).toBeInTheDocument();
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
      expect(headers).toHaveLength(4);
      expect(headers[0]).toHaveTextContent("headers.keyName");
      expect(headers[1]).toHaveTextContent("headers.created");
      expect(headers[2]).toHaveTextContent("headers.lastUsed");
      expect(headers[3]).toHaveTextContent("headers.actions");
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

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes accessibility scan in the empty state", async () => {
      const { container } = renderTable([]);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper ARIA labels for delete buttons", () => {
      renderTable();

      const deleteButtons = screen.getAllByTestId(
        /open-delete-api-key-modal-button-/,
      );
      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute("title", "deleteTriggerTitle");
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

      expect(screen.getByText("never")).toBeInTheDocument();
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
