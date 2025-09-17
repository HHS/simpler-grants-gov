import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import { baseApiKey } from "src/utils/testing/fixtures";

import { NextIntlClientProvider } from "next-intl";

import ApiKeyModal from "src/components/developer/apiDashboard/ApiKeyModal";

// Mock dependencies
const mockClientFetch = jest.fn();
const mockToggleModal = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: jest.fn(),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: () => ({
    current: {
      toggleModal: mockToggleModal,
    },
  }),
}));

const mockUser = {
  user_id: "test-user-id",
  token: "test-token",
};

const mockApiKey: ApiKey = {
  ...baseApiKey,
  api_key_id: "test-api-key-id",
};

const messages = {
  ApiDashboard: {
    modal: {
      apiKeyNameLabel: "Name <required>(required)</required>",
      placeholder: "e.g., Production API Key",
      createTitle: "Create New API Key",
      editTitle: "Rename API Key",
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

const renderModal = (mode: "create" | "edit" | "delete", apiKey?: ApiKey) => {
  const onApiKeyUpdated = jest.fn();

  return {
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ApiKeyModal
          mode={mode}
          apiKey={apiKey}
          onApiKeyUpdated={onApiKeyUpdated}
        />
      </NextIntlClientProvider>,
    ),
    onApiKeyUpdated,
  };
};

describe("ApiKeyModal", () => {
  const mockUseClientFetch = jest.mocked(useClientFetch);
  const mockUseUser = jest.mocked(useUser);

  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleModal.mockClear();
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

  describe("Delete Mode", () => {
    it("renders delete modal with correct content", () => {
      renderModal("delete", mockApiKey);

      expect(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'To confirm deletion, type "delete" in the field below:',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('"Test API Key"')).toBeInTheDocument();
      expect(screen.getByPlaceholderText("delete")).toBeInTheDocument();
    });

    it("shows validation error when delete confirmation is empty", async () => {
      const user = userEvent.setup();
      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Try to submit without typing "delete"
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText('Please type "delete" to confirm deletion'),
        ).toBeInTheDocument();
      });
    });

    it("shows validation error when delete confirmation is incorrect", async () => {
      const user = userEvent.setup();
      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type incorrect confirmation
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "wrong");

      // Try to submit
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText('Please type "delete" to confirm deletion'),
        ).toBeInTheDocument();
      });
    });

    it("successfully deletes API key when confirmation is correct", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });

      const { onApiKeyUpdated } = renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type correct confirmation
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "delete");

      // Submit
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalledWith(
          "/api/user/api-keys/test-api-key-id",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      });

      await waitFor(() => {
        expect(onApiKeyUpdated).toHaveBeenCalled();
      });
    });

    it("shows success message after successful deletion", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });

      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type correct confirmation and submit
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText("API Key Deleted Successfully"),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Your API key "Test API Key" has been deleted successfully.',
        ),
      ).toBeInTheDocument();
    });

    it("shows error message when deletion fails", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockRejectedValue(new Error("API Error"));

      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type correct confirmation and submit
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "There was an error deleting your API key. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("shows loading state during deletion", async () => {
      const user = userEvent.setup();
      let resolveDelete: (value: { message: string }) => void = () => {
        // This will be assigned in the Promise constructor below
      };
      const deletePromise = new Promise<{ message: string }>((resolve) => {
        resolveDelete = resolve;
      });
      mockClientFetch.mockReturnValue(deletePromise);

      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type correct confirmation and submit
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Check loading state
      expect(screen.getByText("Deleting...")).toBeInTheDocument();

      // Resolve the promise
      resolveDelete({ message: "Success" });
    });

    it("throws error when apiKey is not provided for delete mode", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
        // Do nothing - silencing console error for test
      });

      expect(() => {
        renderModal("delete");
      }).toThrow("ApiKey is required when mode is 'delete'");

      consoleSpy.mockRestore();
    });

    it("resets form state when modal is closed", async () => {
      const user = userEvent.setup();
      renderModal("delete", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Type some text
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "partial");

      // Verify the input has the text we typed
      expect(confirmationInput).toHaveValue("partial");

      // Try to submit with wrong text to trigger validation
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Should show validation error
      expect(
        screen.getByText('Please type "delete" to confirm deletion'),
      ).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByText("Cancel"));

      // Wait for modal to be hidden (it stays in DOM but gets hidden class)
      await waitFor(() => {
        // Check that modal has the hidden class
        const dialog = screen.getByRole("dialog", { hidden: true });
        expect(dialog).toHaveClass("is-hidden");
      });

      // Reopen modal
      await user.click(
        screen.getByTestId("open-delete-api-key-modal-button-test-api-key-id"),
      );

      // Wait for modal to be visible again
      await waitFor(() => {
        // Check that modal does not have the hidden class
        const dialog = screen.getByRole("dialog");
        expect(dialog).not.toHaveClass("is-hidden");
      });

      // The validation error should be cleared when modal reopens
      expect(
        screen.queryByText('Please type "delete" to confirm deletion'),
      ).not.toBeInTheDocument();

      // Note: The input field itself doesn't reset because it's uncontrolled,
      // but the React state does reset, which clears validation errors
    });
  });

  describe("Create Mode", () => {
    it("renders create modal with correct content", () => {
      renderModal("create");

      expect(
        screen.getByTestId("open-create-api-key-modal-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Create a new key for use with the Simpler.Grants.gov API",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g., Production API Key"),
      ).toBeInTheDocument();
    });

    it("validates required name field", async () => {
      const user = userEvent.setup();
      renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Try to submit without name
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText("API key name is required"),
        ).toBeInTheDocument();
      });
    });

    it("successfully creates API key", async () => {
      const user = userEvent.setup();
      const createdApiKey = { ...mockApiKey, key_name: "New API Key" };
      mockClientFetch.mockResolvedValue({ data: createdApiKey });

      const { onApiKeyUpdated } = renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Type name
      const nameInput = screen.getByPlaceholderText("e.g., Production API Key");
      await user.type(nameInput, "New API Key");

      // Submit
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalledWith("/api/user/api-keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name: "New API Key",
          }),
        });
      });

      await waitFor(() => {
        expect(onApiKeyUpdated).toHaveBeenCalled();
      });
    });
  });

  describe("Edit Mode", () => {
    it("renders edit modal with correct content", () => {
      renderModal("edit", mockApiKey);

      expect(
        screen.getByTestId("open-edit-api-key-modal-button-test-api-key-id"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Change the name of your Simpler.Grants.gov API key"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test API Key")).toBeInTheDocument();
    });

    it("validates that name has changed", async () => {
      const user = userEvent.setup();
      renderModal("edit", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-edit-api-key-modal-button-test-api-key-id"),
      );

      // Try to submit without changing name
      await user.click(screen.getByTestId("edit-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a different name"),
        ).toBeInTheDocument();
      });
    });

    it("successfully renames API key", async () => {
      const user = userEvent.setup();
      const renamedApiKey = { ...mockApiKey, key_name: "Renamed API Key" };
      mockClientFetch.mockResolvedValue({ data: renamedApiKey });

      const { onApiKeyUpdated } = renderModal("edit", mockApiKey);

      // Open modal
      await user.click(
        screen.getByTestId("open-edit-api-key-modal-button-test-api-key-id"),
      );

      // Change name
      const nameInput = screen.getByDisplayValue("Test API Key");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed API Key");

      // Submit
      await user.click(screen.getByTestId("edit-api-key-submit-button"));

      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalledWith(
          "/api/user/api-keys/test-api-key-id",
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
      });

      await waitFor(() => {
        expect(onApiKeyUpdated).toHaveBeenCalled();
      });
    });

    it("throws error when apiKey is not provided for edit mode", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
        // Do nothing - silencing console error for test
      });

      expect(() => {
        renderModal("edit");
      }).toThrow("ApiKey is required when mode is 'edit'");

      consoleSpy.mockRestore();
    });
  });

  describe("Common Functionality", () => {
    it("handles API errors gracefully", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockRejectedValue(new Error("Network error"));

      renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Type name and submit
      const nameInput = screen.getByPlaceholderText("e.g., Production API Key");
      await user.type(nameInput, "Test Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "There was an error creating your API key. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("shows error when user is not authenticated", async () => {
      const user = userEvent.setup();
      mockUseUser.mockReturnValue({
        user: undefined,
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

      renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Type name and submit
      const nameInput = screen.getByPlaceholderText("e.g., Production API Key");
      await user.type(nameInput, "Test Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "There was an error creating your API key. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("passes accessibility scan", async () => {
      const { container } = renderModal("delete", mockApiKey);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("handles keyboard navigation", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({ message: "Success" });
      renderModal("delete", mockApiKey);

      // Tab to the delete button
      await user.tab();

      // Open modal with Enter key
      await user.keyboard("{Enter}");

      // Should focus on confirmation input
      const confirmationInput = screen.getByPlaceholderText("delete");
      await user.type(confirmationInput, "delete");

      // Submit with mouse click for now (Enter key handling is complex to test)
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Should make the API call
      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalled();
      });
    });
  });
});
