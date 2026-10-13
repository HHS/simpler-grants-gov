import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ApiKeyModal from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyModal";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { ApiKey } from "src/types/apiKeyTypes";
import { baseApiKey } from "src/utils/testing/fixtures";

// Mock dependencies
const mockClientFetch = jest.fn();
const mockToggleModal = jest.fn();
const mockWriteText = jest.fn(() => Promise.resolve());

Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

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

const renderModal = (mode: "create" | "edit" | "delete", apiKey?: ApiKey) => {
  const onApiKeyUpdated = jest.fn();

  return {
    ...render(
      <ApiKeyModal
        mode={mode}
        apiKey={apiKey}
        onApiKeyUpdated={onApiKeyUpdated}
      />,
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
      expect(screen.getByText("deleteDescription")).toBeInTheDocument();
      expect(screen.getByText('"Test API Key"')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("deleteConfirmationPlaceholder"),
      ).toBeInTheDocument();
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
        expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "wrong");

      // Try to submit
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("deleteSuccessHeading")).toBeInTheDocument();
      });

      expect(screen.getByText("deleteSuccessMessage")).toBeInTheDocument();
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("deleteErrorMessage")).toBeInTheDocument();
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "delete");
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Check loading state
      expect(screen.getByText("deleting")).toBeInTheDocument();

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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "partial");

      // Verify the input has the text we typed
      expect(confirmationInput).toHaveValue("partial");

      // Try to submit with wrong text to trigger validation
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Should show validation error
      expect(screen.getByText("deleteConfirmationError")).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByText("cancel"));

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
        screen.queryByText("deleteConfirmationError"),
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
      expect(screen.getByText("createDescription")).toBeInTheDocument();
      expect(
        screen.getByLabelText("createApiKeyNameLabel"),
      ).toBeInTheDocument();
      expect(screen.getByText("createNameHint")).toBeInTheDocument();
    });

    it("uses a hint instead of a placeholder for the name input", () => {
      renderModal("create");

      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      expect(nameInput).not.toHaveAttribute("placeholder");
      expect(nameInput).toHaveAccessibleDescription("createNameHint");
    });

    it("validates required name field", async () => {
      const user = userEvent.setup();
      renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Try to submit without name
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("nameRequiredError")).toBeInTheDocument();
      });
      expect(screen.getByLabelText("createApiKeyNameLabel")).toHaveClass(
        "usa-input--error",
      );
      expect(mockClientFetch).not.toHaveBeenCalled();
    });

    it("shows a field error when the key name already exists", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockRejectedValue(
        new Error("Error creating API key: 422", {
          cause: {
            status: 422,
            body: { errorType: "duplicate_api_key_name" },
          },
        }),
      );

      const { onApiKeyUpdated } = renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));
      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "Existing Name");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("duplicateNameError")).toBeInTheDocument();
      });
      expect(nameInput).toHaveClass("usa-input--error");
      expect(nameInput).toHaveValue("Existing Name");
      expect(screen.queryByText("createErrorHeading")).not.toBeInTheDocument();
      expect(onApiKeyUpdated).not.toHaveBeenCalled();
    });

    it("keeps the create button in place while loading", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockReturnValue(
        new Promise(() => {
          // never resolves, keeping the modal in the loading state
        }),
      );

      renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));
      await user.type(
        screen.getByLabelText("createApiKeyNameLabel"),
        "New API Key",
      );
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      const submitButton = screen.getByTestId("create-api-key-submit-button");
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      expect(submitButton).toHaveTextContent("createSubmitButtonText");
      expect(within(submitButton).getByRole("progressbar")).toBeInTheDocument();
      expect(within(submitButton).getByText("creating")).toBeInTheDocument();
    });

    it("passes accessibility scan", async () => {
      const { container } = renderModal("create");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("successfully creates API key", async () => {
      const user = userEvent.setup();
      const createdApiKey = { ...mockApiKey, key_name: "New API Key" };
      mockClientFetch.mockResolvedValue({ data: createdApiKey });

      const { onApiKeyUpdated } = renderModal("create");

      // Open modal
      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      // Type name
      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
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
      expect(screen.getByText("editDescription")).toBeInTheDocument();
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
        expect(screen.getByText("nameChangedError")).toBeInTheDocument();
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
      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "Test Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("createErrorHeading")).toBeInTheDocument();
      });
      expect(screen.getByText("createErrorMessage")).toBeInTheDocument();

      // the user's input is preserved and not marked as an error
      expect(nameInput).toHaveValue("Test Key");
      expect(nameInput).not.toHaveClass("usa-input--error");
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
      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "Test Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("createErrorMessage")).toBeInTheDocument();
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
      const confirmationInput = screen.getByPlaceholderText(
        "deleteConfirmationPlaceholder",
      );
      await user.type(confirmationInput, "delete");

      // Submit with mouse click for now (Enter key handling is complex to test)
      await user.click(screen.getByTestId("delete-api-key-submit-button"));

      // Should make the API call
      await waitFor(() => {
        expect(mockClientFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Success Content with API Key ID", () => {
    it("displays the API key ID after successful creation", async () => {
      const user = userEvent.setup();
      const createdApiKey = {
        ...mockApiKey,
        key_name: "New API Key",
        key_id: "new-secret-key-123",
      };
      mockClientFetch.mockResolvedValue({ data: createdApiKey });

      renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "New API Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("createSuccessHeading")).toBeInTheDocument();
      });

      expect(screen.getByText("createSuccessAlertHeading")).toBeInTheDocument();
      expect(screen.getByText("createSuccessKeyName")).toBeInTheDocument();
      const keyInput = screen.getByLabelText("createdApiKeyLabel");
      expect(keyInput).toHaveValue("new-secret-key-123");
      expect(keyInput).toHaveAttribute("readonly");
    });

    it("copies the key and briefly shows copied feedback", async () => {
      const user = userEvent.setup();
      const createdApiKey = {
        ...mockApiKey,
        key_name: "New API Key",
        key_id: "copy-this-key",
      };
      mockClientFetch.mockResolvedValue({ data: createdApiKey });

      renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "New API Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      const modal = await screen.findByRole("dialog");
      const copyButton = await within(modal).findByRole("button", {
        name: "copyKey",
      });

      await user.click(copyButton);

      // userEvent.setup() swaps in its own clipboard stub, so read it back
      await expect(navigator.clipboard.readText()).resolves.toBe(
        "copy-this-key",
      );
      await waitFor(() => {
        expect(copyButton).toHaveTextContent("copied");
      });
      await waitFor(
        () => {
          expect(copyButton).toHaveTextContent("copyKey");
        },
        { timeout: 3000 },
      );
    });

    it("does not resubmit when Enter is pressed in the success state", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({
        data: { ...mockApiKey, key_name: "New Key", key_id: "enter-key" },
      });

      renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));
      await user.type(
        screen.getByLabelText("createApiKeyNameLabel"),
        "New Key",
      );
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      const keyInput = await screen.findByLabelText("createdApiKeyLabel");
      await user.click(keyInput);
      await user.keyboard("{Enter}");

      expect(mockClientFetch).toHaveBeenCalledTimes(1);
    });

    it("passes accessibility scan in the success state", async () => {
      const user = userEvent.setup();
      mockClientFetch.mockResolvedValue({
        data: { ...mockApiKey, key_name: "New Key", key_id: "a11y-key" },
      });

      const { container } = renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));
      await user.type(
        screen.getByLabelText("createApiKeyNameLabel"),
        "New Key",
      );
      await user.click(screen.getByTestId("create-api-key-submit-button"));
      await screen.findByLabelText("createdApiKeyLabel");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("does not display the API key ID after successful edit", async () => {
      const user = userEvent.setup();
      const renamedApiKey = {
        ...mockApiKey,
        key_name: "Renamed Key",
        key_id: "edit-key-456",
      };
      mockClientFetch.mockResolvedValue({ data: renamedApiKey });

      renderModal("edit", mockApiKey);

      await user.click(
        screen.getByTestId("open-edit-api-key-modal-button-test-api-key-id"),
      );

      const nameInput = screen.getByDisplayValue("Test API Key");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed Key");
      await user.click(screen.getByTestId("edit-api-key-submit-button"));

      await waitFor(() => {
        expect(screen.getByText("editSuccessHeading")).toBeInTheDocument();
      });

      expect(screen.queryByText("edit-key-456")).not.toBeInTheDocument();
    });

    it("shows done button in success content", async () => {
      const user = userEvent.setup();
      const createdApiKey = {
        ...mockApiKey,
        key_name: "New Key",
        key_id: "success-key",
      };
      mockClientFetch.mockResolvedValue({ data: createdApiKey });

      renderModal("create");

      await user.click(screen.getByTestId("open-create-api-key-modal-button"));

      const nameInput = screen.getByLabelText("createApiKeyNameLabel");
      await user.type(nameInput, "New Key");
      await user.click(screen.getByTestId("create-api-key-submit-button"));

      await waitFor(() => {
        expect(
          screen.getByTestId("close-create-api-key-modal-button"),
        ).toHaveTextContent("done");
      });
    });
  });
});
