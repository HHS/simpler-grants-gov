import { act, fireEvent, render, screen } from "@testing-library/react";

import { EditSavedSearchModal } from "src/components/workspace/EditSavedSearchModal";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const clientFetchMock = jest.fn();
const routerPush = jest.fn(() => Promise.resolve(true));

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

describe("EditSavedSearchModal", () => {
  afterEach(() => {
    clientFetchMock.mockReset();
    jest.clearAllTimers();
  });

  it("displays a working modal toggle button", async () => {
    const { rerender } = render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId(
      "open-edit-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-edit-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const closeButton = await screen.findByText("cancelText");
    act(() => closeButton.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });
  it("displays validation error if submitted without a name", async () => {
    const { rerender } = render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-edit-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const saveButton = await screen.findByTestId("edit-saved-search-button-1");
    act(() => saveButton.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const validationError = await screen.findByText("emptyNameError");

    expect(validationError).toBeInTheDocument();
  });
  it("displays an API error if API returns an error", async () => {
    clientFetchMock.mockRejectedValue(new Error());
    const { rerender } = render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-edit-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const saveButton = await screen.findByTestId("edit-saved-search-button-1");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    act(() => saveButton.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const error = await screen.findByText("apiError");

    expect(error).toBeInTheDocument();
  });

  it("displays a success message on successful save", async () => {
    clientFetchMock.mockResolvedValue({ id: "123" });
    const { rerender } = render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-edit-saved-search-modal-button-1",
    );
    act(() => toggle.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const saveButton = await screen.findByTestId("edit-saved-search-button-1");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    act(() => saveButton.click());

    rerender(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );

    const success = await screen.findByLabelText("success");

    expect(success).toHaveTextContent("updatedNotification");
  });
  it("defaults input to current name of query", () => {
    render(
      <EditSavedSearchModal
        queryName="excellent query"
        savedSearchId="1"
        editText="edit"
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("excellent query");
  });
});
