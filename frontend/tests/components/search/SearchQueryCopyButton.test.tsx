import { render, screen } from "@testing-library/react";

import SearchQueryCopyButton from "src/components/search/SearchQueryCopyButton";

const copyText = "copy this";
const copyingText = "copying";
const copiedText = "copied";
// const helpText = "click this to copy and share";
const snackbarMessage = "you did it";

// jest.mock("src/components/TooltipWrapper", () => {
//   return {
//     __esModule: true,
//     default: () => {
//       return <div>{copyText}</div>;
//     },
//   };
// });

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

  // Doesn't work without adding support for dynamic imports
  // eslint-disable-next-line jest/no-disabled-tests
  it("Shows children", () => {
    render(
      <SearchQueryCopyButton {...SearchQueryCopyButtonProps}>
        <div data-testid="anything"></div>
      </SearchQueryCopyButton>,
    );
    expect(screen.getByTestId("anything")).toBeInTheDocument();
  });
});
