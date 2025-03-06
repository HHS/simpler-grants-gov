import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SaveSearchModal } from "src/components/search/SaveSearchModal";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const mockSaveSearch = jest.fn();

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));
jest.mock("src/services/fetch/fetchers/clientSavedSearchFetcher", () => ({
  saveSearch: (...args) => mockSaveSearch(...args),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.useFakeTimers();

describe("SaveSearchModal", () => {
  afterEach(() => {
    mockSaveSearch.mockReset();
    jest.clearAllTimers();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(<SaveSearchModal />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal />);

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(<SaveSearchModal />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal />);

    const closeButton = await screen.findByText("cancelText");
    closeButton.click();

    rerender(<SaveSearchModal />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });
  it("displays validation error if submitted without a name", async () => {
    const { rerender } = render(<SaveSearchModal />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal />);

    const saveButton = await screen.findByTestId("save-search-button");
    saveButton.click();

    rerender(<SaveSearchModal />);

    const validationError = await screen.findByText("emptyNameError");

    expect(validationError).toBeInTheDocument();
  });
  it("displays an API error if API returns an error", async () => {
    mockSaveSearch.mockRejectedValue(new Error());
    const { rerender } = render(<SaveSearchModal />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal />);

    const saveButton = await screen.findByTestId("save-search-button");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    saveButton.click();

    rerender(<SaveSearchModal />);

    // this isn't translated... update after entering real text
    const error = await screen.findByText(
      "Failed to save search. Please try again.",
    );

    expect(error).toBeInTheDocument();
  });
  it("displays a success message on successful save", async () => {
    mockSaveSearch.mockResolvedValue({ arbitrary: "data" });
    const { rerender } = render(<SaveSearchModal />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal />);

    const saveButton = await screen.findByTestId("save-search-button");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    saveButton.click();

    rerender(<SaveSearchModal />);

    // this isn't translated... update after entering real text
    const success = await screen.findByText("successDescription");

    expect(success).toBeInTheDocument();
  });
});
