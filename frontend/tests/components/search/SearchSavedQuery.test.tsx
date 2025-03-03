// import { render, screen } from "tests/react-utils";
import { render, screen } from "@testing-library/react";
import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import SavedSearchQuery from "src/components/search/SavedSearchQuery";

// import TooltipWrapper from "src/components/TooltipWrapper";

const copyText = "copy this";
const copiedText = "copied";
const helpText = "click this to copy and share";

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
      return <div>wtf</div>;
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
  copyingText: "copying",
  copiedText,
  helpText,
  url: "http://example.com/search?query=test",
  snackbarMessage: <>You did it</>,
};
afterEach(() => {
  jest.restoreAllMocks();
});

const mockCopyToClipboardValues = {
  copied: false,
  loading: false,
  copyToClipboard: async () => Promise.resolve(),
};
const mockSnackbarValues = {
  snackbarIsVisible: false,
  showSnackbar: () => undefined,
  Snackbar: () => {
    return <div>wtxf</div>;
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
    const copyButton = screen.getByTestId("save-search-query");
    copyButton.click();
    expect(copyButton).toBeInTheDocument();
    expect(screen.getByText(copiedText)).toBeInTheDocument();
    expect(screen.getByText("wtf")).toBeInTheDocument();
  });
});
