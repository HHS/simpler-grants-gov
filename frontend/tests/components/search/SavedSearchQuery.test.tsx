import { render, screen } from "@testing-library/react";
import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import SavedSearchQuery from "src/components/search/SavedSearchQuery";

const copyText = "copy this";
const copyingText = "copying";
const copiedText = "copied";
const helpText = "click this to copy and share";
const snackbarMessage = "you did it";

jest.mock("src/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock("src/hooks/useSnackbar", () => ({
  useSnackbar: jest.fn(),
}));

jest.mock("src/components/TooltipWrapper", () => {
  return {
    __esModule: true,
    default: () => {
      return <div>{copyText}</div>;
    },
  };
});

const mockedUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;
const mockedUseSnackBar = useSnackbar as jest.MockedFunction<
  typeof useSnackbar
>;

const SavedSearchQueryProps = {
  copyText,
  copyingText,
  copiedText,
  helpText,
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
    render(<SavedSearchQuery {...SavedSearchQueryProps} />);
    const copyButton = screen.getByTestId("save-search-query");
    expect(copyButton).toBeInTheDocument();
    expect(screen.getByText(copyText)).toBeInTheDocument();
  });

  it("Shows copied state", () => {
    mockedUseCopyToClipboard.mockReturnValue({
      ...mockCopyToClipboardValues,
      ...{ copied: true },
    });
    render(<SavedSearchQuery {...SavedSearchQueryProps} />);
    expect(screen.getByText(copiedText)).toBeInTheDocument();
  });

  it("Shows snackbar", () => {
    mockedUseSnackBar.mockReturnValue({
      ...mockSnackbarValues,
    });
    render(<SavedSearchQuery {...SavedSearchQueryProps} />);
    expect(screen.getByText(snackbarMessage)).toBeInTheDocument();
  });

  // Doesn't work without adding support for dynamic imports
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("Shows tooltip", () => {
    render(<SavedSearchQuery {...SavedSearchQueryProps} />);
    expect(screen.getByText(helpText)).toBeInTheDocument();
  });
});
