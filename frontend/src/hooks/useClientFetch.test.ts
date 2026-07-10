import { renderHook } from "@testing-library/react";
import { useClientFetch } from "src/hooks/useClientFetch";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const refreshMock = jest.fn();
const refreshIfExpiredMock = jest.fn();
const refreshIfExpiringMock = jest.fn();
const refreshUserMock = jest.fn();
const jsonMock = jest.fn();

const mockResponse = {
  status: 200,
  ok: true,
  json: () => jsonMock() as unknown,
} as unknown as Response;

const fetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => refreshMock() as unknown,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    refreshIfExpired: () => refreshIfExpiredMock() as unknown,
    refreshUser: () => refreshUserMock() as unknown,
    refreshIfExpiring: () => refreshIfExpiringMock() as unknown,
  }),
}));

describe("useClientFetch", () => {
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
  it("checks expiration and calls fetch", async () => {
    const { result } = renderHook(() => useClientFetch("an error!"));
    await result.current.clientFetch("http://wherever");
    expect(refreshIfExpiredMock).toHaveBeenCalledTimes(1);
    expect(refreshIfExpiringMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).toHaveBeenCalledTimes(0);
    expect(refreshUserMock).toHaveBeenCalledTimes(0);
  });
  it("if user logged out and auth gated, throw and refresh page before fetching", async () => {
    refreshIfExpiredMock.mockReturnValue(true);
    const { result } = renderHook(() =>
      useClientFetch("an error!", { authGatedRequest: true }),
    );
    await wrapForExpectedError(() =>
      result.current.clientFetch("http://wherever"),
    );

    expect(refreshIfExpiredMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(refreshUserMock).toHaveBeenCalledTimes(0);
  });
  it("on 401 and auth gated, refresh page and user", async () => {
    fetchMock.mockResolvedValue({ status: 401 });
    const { result } = renderHook(() =>
      useClientFetch("an error!", { authGatedRequest: true }),
    );
    await wrapForExpectedError(() =>
      result.current.clientFetch("http://wherever"),
    );

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshUserMock).toHaveBeenCalledTimes(1);
  });
  it("calls json and returns json data on success by default", async () => {
    jsonMock.mockResolvedValue({ oh: "hi" });
    const { result } = renderHook(() => useClientFetch("an error!"));
    const response = await result.current.clientFetch("http://wherever");
    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ oh: "hi" });
  });
  it("returns raw response if json not enabled", async () => {
    const { result } = renderHook(() =>
      useClientFetch("an error!", { jsonResponse: false }),
    );
    const response = await result.current.clientFetch("http://wherever");
    expect(jsonMock).toHaveBeenCalledTimes(0);
    expect(response).toEqual(mockResponse);
  });
  it("throws if response is not an ok or 200", async () => {
    fetchMock.mockResolvedValue({ status: 500, ok: false });
    const { result } = renderHook(() => useClientFetch("an error!"));
    const error = await wrapForExpectedError(() =>
      result.current.clientFetch("http://wherever"),
    );
    expect(jsonMock).toHaveBeenCalledTimes(0);
    expect(error.message).toEqual("an error!: 500");
  });
});
