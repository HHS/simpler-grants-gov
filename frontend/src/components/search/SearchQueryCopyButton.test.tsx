import { render, screen } from "@testing-library/react";

import SearchQueryCopyButton from "src/components/search/SearchQueryCopyButton";

const copyText = "copy this";
const copyingText = "copying";
const copiedText = "copied";
const snackbarMessage = "you did it";

jest.mock("src/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: () => mockedUseCopyToClipboard() as unknown,
}));

jest.mock("src/hooks/useSnackbar", () => ({
  useSnackbar: () => mockedUseSnackBar() as unknown,
}));

const mockedUseCopyToClipboard = jest.fn();
const mockedUseSnackBar = jest.fn();

const SearchQueryCopyButtonProps = {
  copyText,
  copyingText,
  copiedText,
  url: "http://example.com/search?query=test",
  snackbarMessage,
};
afterEach(() => {
  jest.restoreAllMocks();
});

const mockCopyToClipboardValues = {
  copied: false,
  copying: false,
  copyToClipboard: async () => Promise.resolve(),
};
const mockSnackbarValues = {
  hideSnackbar: () => undefined,
  snackbarIsVisible: false,
  showSnackbar: () => undefined,
  Snackbar: () => {
    return <div>{snackbarMessage}</div>;
  },
};

describe("SaveButton", () => {
  it("Renders without errors", () => {
    mockedUseCopyToClipboard.mockReturnValue(mockCopyToClipboardValues);
    mockedUseSnackBar.mockReturnValue(mockSnackbarValues);
    render(<SearchQueryCopyButton {...SearchQueryCopyButtonProps} />);
    const copyButton = screen.getByTestId("save-search-query");
    expect(copyButton).toBeInTheDocument();
    expect(screen.getByText(copyText)).toBeInTheDocument();
  });

  it("Shows copied state", () => {
    mockedUseCopyToClipboard.mockReturnValue({
      ...mockCopyToClipboardValues,
      ...{ copied: true },
    });
    render(<SearchQueryCopyButton {...SearchQueryCopyButtonProps} />);
    expect(screen.getByText(copiedText)).toBeInTheDocument();
  });

  it("Shows snackbar", () => {
    mockedUseSnackBar.mockReturnValue({
      ...mockSnackbarValues,
    });
    render(<SearchQueryCopyButton {...SearchQueryCopyButtonProps} />);
    expect(screen.getByText(snackbarMessage)).toBeInTheDocument();
  });

  it("Shows children", () => {
    render(
      <SearchQueryCopyButton {...SearchQueryCopyButtonProps}>
        <div data-testid="anything"></div>
      </SearchQueryCopyButton>,
    );
    expect(screen.getByTestId("anything")).toBeInTheDocument();
  });
});
