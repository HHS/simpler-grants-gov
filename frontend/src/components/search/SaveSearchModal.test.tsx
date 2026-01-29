import { act, fireEvent, render, screen } from "@testing-library/react";
import { identity, noop } from "lodash";

import { SaveSearchModal } from "src/components/search/SaveSearchModal";

const fakeSearchParams = new URLSearchParams();

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const clientFetchMock = jest.fn();

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("src/utils/search/searchFormatUtils", () => ({
  filterSearchParams: identity,
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => fakeSearchParams,
}));

jest.useFakeTimers();

describe("SaveSearchModal", () => {
  afterEach(() => {
    clientFetchMock.mockReset();
    jest.clearAllTimers();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(<SaveSearchModal onSave={noop} />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal onSave={noop} />);

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(<SaveSearchModal onSave={noop} />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const closeButton = await screen.findByText("cancelText");
    closeButton.click();

    rerender(<SaveSearchModal onSave={noop} />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });
  it("displays validation error if submitted without a name", async () => {
    const { rerender } = render(<SaveSearchModal onSave={noop} />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const saveButton = await screen.findByTestId("save-search-button");
    saveButton.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const validationError = await screen.findByText("emptyNameError");

    expect(validationError).toBeInTheDocument();
  });
  it("displays an API error if API returns an error", async () => {
    clientFetchMock.mockRejectedValue(new Error());
    const { rerender } = render(<SaveSearchModal onSave={noop} />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    act(() => {
      toggle.click();
    });

    rerender(<SaveSearchModal onSave={noop} />);

    const saveButton = await screen.findByTestId("save-search-button");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    saveButton.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const error = await screen.findByText("apiError");

    expect(error).toBeInTheDocument();
  });

  it("displays a success message on successful save", async () => {
    clientFetchMock.mockResolvedValue({ id: "123" });
    const { rerender } = render(<SaveSearchModal onSave={noop} />);

    const toggle = await screen.findByTestId("open-save-search-modal-button");
    toggle.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const saveButton = await screen.findByTestId("save-search-button");
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "save search name" } });
    saveButton.click();

    rerender(<SaveSearchModal onSave={noop} />);

    const success = await screen.findByText("successDescription");

    expect(success).toBeInTheDocument();
  });
});
