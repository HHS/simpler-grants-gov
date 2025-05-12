import { act, render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { DeleteSavedSearchModal } from "src/components/workspace/DeleteSavedSearchModal";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const routerPush = jest.fn(() => Promise.resolve(true));
const clientFetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.useFakeTimers();

describe("DeleteSavedSearchModal", () => {
  afterEach(() => {
    clientFetchMock.mockReset();
    jest.clearAllTimers();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const closeButton = await screen.findByText("cancelText");
    act(() => closeButton.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });

  it("displays an API error if API returns an error", async () => {
    clientFetchMock.mockRejectedValue(new Error());
    const { rerender } = render(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const saveButton = await screen.findByTestId(
      "delete-saved-search-button-1",
    );
    act(() => saveButton.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const error = await screen.findByText("apiError");

    expect(error).toBeInTheDocument();
  });

  it("displays a success message on successful save", async () => {
    clientFetchMock.mockResolvedValue({ id: "123" });
    const { rerender } = render(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-delete-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const saveButton = await screen.findByTestId(
      "delete-saved-search-button-1",
    );
    act(() => saveButton.click());

    rerender(
      <DeleteSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        deleteText="delete"
      />,
    );

    const success = await screen.findByText("successTitle");

    expect(success).toBeInTheDocument();
  });
});
