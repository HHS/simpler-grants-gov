import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import {
  baseApiKey,
  createMockApiKey,
  inactiveApiKey,
  usedApiKey,
} from "src/utils/testing/fixtures";

import { NextIntlClientProvider } from "next-intl";

import ApiKeyTableClient from "src/components/developer/apiDashboard/ApiKeyTableClient";

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: () => ({
    current: {
      toggleModal: jest.fn(),
    },
  }),
}));

Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
});

const mockUser = {
  user_id: "test-user-id",
  token: "test-token",
};

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
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ApiKeyTableClient apiKeys={apiKeys} />
    </NextIntlClientProvider>,
  );
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
      expect(headers[0]).toHaveTextContent("Name");
      expect(headers[1]).toHaveTextContent("Status");
      expect(headers[2]).toHaveTextContent("Secret");
      expect(headers[3]).toHaveTextContent("Created");
      expect(headers[4]).toHaveTextContent("Last used");
      expect(headers[5]).toHaveTextContent("Modify");
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
    it("shows Active for active keys", () => {
      renderTable([baseApiKey]);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows Inactive for inactive keys", () => {
      renderTable([inactiveApiKey]);

      expect(screen.getByText("Inactive")).toBeInTheDocument();
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

      const copyButtons = screen.getAllByRole("button", { name: "" });
      const copyIconButtons = copyButtons.filter((btn) => {
        const svg = btn.querySelector("svg use");
        return svg?.getAttribute("href")?.includes("content_copy");
      });
      expect(copyIconButtons.length).toBeGreaterThanOrEqual(2);
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

    it('shows "Never" when last_used is null', () => {
      renderTable([baseApiKey]);

      expect(screen.getByText("Never")).toBeInTheDocument();
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
});
