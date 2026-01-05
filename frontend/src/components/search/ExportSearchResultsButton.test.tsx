import { axe } from "jest-axe";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { render, screen, waitFor } from "tests/react-utils";

import { ExportSearchResultsButton } from "src/components/search/ExportSearchResultsButton";

const clientFetchMock = jest.fn();
const mockSaveBlobToFile = jest.fn();

const fakeSearchParams = new URLSearchParams();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("src/utils/generalUtils", () => ({
  saveBlobToFile: (...args: unknown[]): unknown => mockSaveBlobToFile(...args),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => fakeSearchParams,
}));

describe("ExportSearchResultsButton", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<ExportSearchResultsButton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("calls downloadSearchResultsCSV with correct args on button click", () => {
    clientFetchMock.mockResolvedValue({});
    render(<ExportSearchResultsButton />);
    const button = screen.getByRole("button");
    button.click();

    expect(clientFetchMock).toHaveBeenCalledWith(`/api/search/export?`);
  });

  it("calls blob on the API response", async () => {
    const mockBlob = jest.fn().mockResolvedValue("blob value");
    clientFetchMock.mockResolvedValue({
      blob: mockBlob,
    });
    render(<ExportSearchResultsButton />);
    const button = screen.getByRole("button");
    button.click();

    await waitFor(() => expect(mockBlob).toHaveBeenCalledTimes(1));
  });

  it("calls saveBlopToFile on the blob", async () => {
    const mockBlob = jest.fn().mockResolvedValue("blob value");
    clientFetchMock.mockResolvedValue({
      blob: mockBlob,
    });
    render(<ExportSearchResultsButton />);
    const button = screen.getByRole("button");
    button.click();

    await waitFor(() => expect(mockSaveBlobToFile).toHaveBeenCalledTimes(1));
    expect(mockSaveBlobToFile).toHaveBeenCalledWith(
      "blob value",
      `grants-search-${getConfiguredDayJs()(new Date()).format("YYYYMMDDHHmm")}.csv`,
    );
  });
});
