/* eslint-disable @typescript-eslint/unbound-method */

import { downloadSearchResultsCSV } from "src/services/fetch/fetchers/clientSearchResultsDownloadFetcher";
import { getConfiguredDayJs } from "src/utils/dateUtil";

import { ReadonlyURLSearchParams } from "next/navigation";

const fakeBlob = new Blob();

const mockBlob = jest.fn(() => fakeBlob);

const mockFetch = jest.fn(() =>
  Promise.resolve({
    blob: mockBlob,
    ok: true,
  }),
);
const mockSaveBlobToFile = jest.fn();

jest.mock("src/utils/generalUtils", () => ({
  saveBlobToFile: (...args: unknown[]): unknown => mockSaveBlobToFile(...args),
}));

describe("downloadSearchResultsCSV", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("calls fetch with correct url", async () => {
    await downloadSearchResultsCSV(
      new ReadonlyURLSearchParams("status=fake&agency=alsoFake"),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/export?status=fake&agency=alsoFake",
    );
  });

  it("blobs the response", async () => {
    await downloadSearchResultsCSV(
      new ReadonlyURLSearchParams("status=fake&agency=alsoFake"),
    );
    expect(mockBlob).toHaveBeenCalledTimes(1);
  });

  it("calls save to blob with the blob result", async () => {
    await downloadSearchResultsCSV(
      new ReadonlyURLSearchParams("status=fake&agency=alsoFake"),
    );
    expect(mockSaveBlobToFile).toHaveBeenCalledWith(
      fakeBlob,
      `grants-search-${getConfiguredDayJs()(new Date()).format("YYYYMMDDHHmm")}.csv`,
    );
  });
});
