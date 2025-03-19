import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { DeleteSavedSearchModal } from "src/components/workspace/DeleteSavedSearchModal";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const mockDeleteSearch = jest.fn();
const mockSearchParams = new URLSearchParams();
const routerPush = jest.fn(() => Promise.resolve(true));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: jest.fn(
    () => mockSearchParams,
  ) as jest.Mock<URLSearchParams>,
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));
jest.mock("src/services/fetch/fetchers/clientSavedSearchFetcher", () => ({
  deleteSavedSearch: (...args: unknown[]) =>
    mockDeleteSearch(...args) as unknown,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.useFakeTimers();

describe("DeleteSavedSearchModal", () => {
  afterEach(() => {
    mockDeleteSearch.mockReset();
    jest.clearAllTimers();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(
      <DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(
      <DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    const closeButton = await screen.findByText("cancelText");
    act(() => closeButton.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });

  it("displays an API error if API returns an error", async () => {
    mockDeleteSearch.mockRejectedValue(new Error());
    const { rerender } = render(
      <DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    const saveButton = await screen.findByTestId(
      "delete-saved-search-button-1",
    );
    act(() => saveButton.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    const error = await screen.findByText("apiError");

    expect(error).toBeInTheDocument();
  });

  it("displays a success message on successful save", async () => {
    mockDeleteSearch.mockResolvedValue({ id: "123" });
    const { rerender } = render(
      <DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    const saveButton = await screen.findByTestId(
      "delete-saved-search-button-1",
    );
    act(() => saveButton.click());

    rerender(<DeleteSavedSearchModal savedSearchId="1" deleteText="delete" />);

    const success = await screen.findByText("successTitle");

    expect(success).toBeInTheDocument();
  });
});
