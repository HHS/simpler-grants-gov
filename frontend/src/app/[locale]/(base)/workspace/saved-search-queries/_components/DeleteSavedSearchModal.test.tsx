import { act, render, screen } from "@testing-library/react";

import { DeleteSavedSearchModal } from "./DeleteSavedSearchModal";

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

jest.useFakeTimers();

describe("DeleteSavedSearchModal", () => {
  afterEach(() => {
    clientFetchMock.mockReset();
    jest.clearAllTimers();
  });

  // One of these renders per saved search row. The modal id used to be the
  // literal "save-search", so every row shared an id and each row's opener
  // pointed aria-controls at the first row's dialog.
  // https://github.com/HHS/simpler-grants-gov/issues/11493
  it("gives each row's dialog an id scoped to its saved search", () => {
    render(
      <>
        <DeleteSavedSearchModal
          queryName="first query"
          savedSearchId="1"
          deleteText="delete"
        />
        <DeleteSavedSearchModal
          queryName="second query"
          savedSearchId="2"
          deleteText="delete"
        />
      </>,
    );

    const ids = screen
      .getAllByRole("dialog", { hidden: true })
      .map((d) => d.id);
    expect(ids).toEqual(["delete-save-search-1", "delete-save-search-2"]);
    expect(new Set(ids).size).toBe(ids.length);
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
