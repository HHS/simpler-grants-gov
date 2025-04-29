import { debouncedUserFetcher } from "src/services/fetch/fetchers/clientUserFetcher";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const jsonMock = jest.fn();

const mockResponse = {
  status: 200,
  ok: true,
  json: () => jsonMock() as unknown,
} as unknown as Response;

const fetchMock = jest.fn();

describe("debouncedClientUserFetcher", () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    fetchMock.mockImplementation(() => Promise.resolve(mockResponse));
    originalFetch = global.fetch;
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });
  it("calls fetch and returns data on success as expected", async () => {
    jsonMock.mockResolvedValue({ a: "thing " });
    const response = await debouncedUserFetcher();
    expect(response).toMatchObject({ a: "thing " });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", {
      cache: "no-store",
    });
  });
  it("throws on non 200", async () => {
    fetchMock.mockResolvedValue({ status: 500, ok: false });
    const error = await wrapForExpectedError(() => debouncedUserFetcher());
    expect(error).toBeInstanceOf(Error);
  });
});
