import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity, noop } from "lodash";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SaveSearchModal } from "src/components/search/SaveSearchModal";

const searchParameters = new URLSearchParams();

const useUserMockImplementation = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const clientFetchMockImplementation = jest.fn();

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => useUserMockImplementation(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...arguments_: unknown[]) =>
      clientFetchMockImplementation(...arguments_) as unknown,
  }),
}));

jest.mock("src/utils/search/searchFormatUtils", () => ({
  filterSearchParams: identity,
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParameters,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("SaveSearchModal", () => {
  afterEach(() => {
    clientFetchMockImplementation.mockReset();
    useUserMockImplementation.mockClear();
  });

  it("renders a save-search opener button", () => {
    render(<SaveSearchModal onSave={noop} />);

    expect(
      screen.getByTestId("open-save-search-modal-button"),
    ).toBeInTheDocument();
  });

  it("opens the modal when the opener is clicked", async () => {
    const user = userEvent.setup();
    render(<SaveSearchModal onSave={noop} />);

    const modalDialog = screen.getByRole("dialog");
    expect(modalDialog).toHaveClass("is-hidden");

    await user.click(screen.getByTestId("open-save-search-modal-button"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
    });

    // “title” is returned by the translation mock as a key; this ensures content is present.
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "inputLabel" }),
    ).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<SaveSearchModal onSave={noop} />);

    await user.click(screen.getByTestId("open-save-search-modal-button"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
    });

    // Cancel button text comes from translations (mock returns the key)
    await user.click(screen.getByText("cancelText"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveClass("is-hidden");
    });
  });

  it("shows a validation error if Save is clicked with an empty name", async () => {
    const user = userEvent.setup();
    render(<SaveSearchModal onSave={noop} />);

    await user.click(screen.getByTestId("open-save-search-modal-button"));

    await user.click(screen.getByTestId("save-search-button"));

    expect(screen.getByText("emptyNameError")).toBeInTheDocument();
  });

  it("posts filtered search params and calls onSave on success, then shows success content", async () => {
    const user = userEvent.setup();
    const onSaveSpy = jest.fn();

    clientFetchMockImplementation.mockResolvedValue({ id: "123" });

    render(<SaveSearchModal onSave={onSaveSpy} />);

    await user.click(screen.getByTestId("open-save-search-modal-button"));

    const searchNameInput = screen.getByRole("textbox", { name: "inputLabel" });
    await user.type(searchNameInput, "Saved search name");

    await user.click(screen.getByTestId("save-search-button"));

    await waitFor(() => {
      expect(onSaveSpy).toHaveBeenCalledWith("123");
    });

    // Success view
    expect(screen.getByText("successTitle")).toBeInTheDocument();
    expect(screen.getByText("successDescription")).toBeInTheDocument();

    // Success view renders
    expect(screen.getByText("successTitle")).toBeInTheDocument();
    expect(screen.getByText("successDescription")).toBeInTheDocument();

    // NOTE: We intentionally do not assert the workspace link here because our next-intl
    // mock returns plain strings for t.rich(), so the <a> element is not rendered in this test.

    // Ensure we called the API with expected endpoint + method
    await waitFor(() => {
      expect(clientFetchMockImplementation).toHaveBeenCalled();
    });

    const [firstCallUrl, firstCallOptions] = clientFetchMockImplementation.mock
      .calls[0] as unknown[];
    expect(firstCallUrl).toBe("/api/user/saved-searches");

    const requestOptions = firstCallOptions as {
      method?: unknown;
      body?: unknown;
    };
    expect(requestOptions.method).toBe("POST");
    expect(typeof requestOptions.body).toBe("string");
  });

  it("shows an API error alert when the API request fails", async () => {
    const user = userEvent.setup();

    clientFetchMockImplementation.mockRejectedValue(
      new Error("Request failed"),
    );

    render(<SaveSearchModal onSave={noop} />);

    await user.click(screen.getByTestId("open-save-search-modal-button"));

    const searchNameInput = screen.getByRole("textbox", { name: "inputLabel" });
    await user.type(searchNameInput, "Saved search name");

    await user.click(screen.getByTestId("save-search-button"));

    await waitFor(() => {
      expect(screen.getByText("apiError")).toBeInTheDocument();
    });
  });
});
