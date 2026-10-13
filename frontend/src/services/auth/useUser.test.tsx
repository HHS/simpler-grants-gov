import { render, renderHook, screen, waitFor } from "@testing-library/react";
import UserProvider from "src/services/auth/UserProvider";
import { useUser } from "src/services/auth/useUser";

import { PropsWithChildren } from "react";

const debouncedUserFetcherMock = jest.fn();

jest.mock("src/services/fetch/fetchers/clientUserFetcher", () => ({
  debouncedUserFetcher: () => debouncedUserFetcherMock() as unknown,
}));

const fetchMock = jest.fn(() => Promise.resolve({ ok: true } as Response));
global.fetch = fetchMock;

const UseUserConsumer = () => {
  const { error, isLoading, user } = useUser();
  return (
    <>
      <div data-testid="error">{error?.toString() || ""}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="user">{user?.isLoggedIn?.toString() || ""}</div>
    </>
  );
};

const renderWrappedConsumer = () => {
  const { rerender } = render(
    <UserProvider featureFlagDefaults={{}}>
      <UseUserConsumer />
    </UserProvider>,
  );
  return () =>
    rerender(
      <UserProvider featureFlagDefaults={{}}>
        <UseUserConsumer />
      </UserProvider>,
    );
};

const wrapper = ({ children }: PropsWithChildren) => (
  <UserProvider featureFlagDefaults={{}}>{children}</UserProvider>
);

describe("useUser", () => {
  afterEach(() => jest.clearAllMocks());
  it("renders with the expected state on successful fetch", async () => {
    debouncedUserFetcherMock.mockResolvedValue({ isLoggedIn: true });

    renderWrappedConsumer();

    const errorDisplay = await screen.findByTestId("error");
    const userDisplay = await screen.findByTestId("user");

    await waitFor(() => {
      expect(userDisplay).toHaveTextContent("true");
    });

    expect(errorDisplay).toBeEmptyDOMElement();
    expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
  });

  it("renders with the expected state on error", async () => {
    debouncedUserFetcherMock.mockResolvedValue(null);
    renderWrappedConsumer();

    const errorDisplay = await screen.findByTestId("error");
    const userDisplay = await screen.findByTestId("user");

    await waitFor(() => {
      expect(errorDisplay).not.toBeEmptyDOMElement();
    });

    expect(userDisplay).toBeEmptyDOMElement();
    expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
  });
  it("sets user as logged out if second fetch for user comes back logged out", async () => {
    debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: true });
    const wrapper = ({ children }: PropsWithChildren) => (
      <UserProvider featureFlagDefaults={{}}>{children}</UserProvider>
    );
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(true);
    });

    expect(result.current.hasBeenLoggedOut).toEqual(false);

    debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(false);
    });
    expect(result.current.hasBeenLoggedOut).toEqual(true);
    // clears the correlation id cookie server-side, mirroring explicit logout
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });
  it("does not clear the correlation id when an anonymous user remains logged out", async () => {
    debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(false);
    });

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(false);
    });
    expect(result.current.hasBeenLoggedOut).toEqual(false);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });
  describe("logoutLocalUser", () => {
    it("marks the user as logged out", async () => {
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: true });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });

      result.current.logoutLocalUser();

      await waitFor(() =>
        expect(result.current.user?.isLoggedIn).toEqual(false),
      );
    });
  });
  describe("refreshIfExpired", () => {
    it("makes fetch call if token is expired", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: true,
        expiresAt: Date.now() - 10000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpired();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(2);
    });
    it("does not make fetch call if token is not expired", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: true,
        expiresAt: Date.now() + 10000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpired();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
    });
    it("does not make a fetch call if the user is not logged in", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: false,
        expiresAt: Date.parse("1-1-2099"),
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(false);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpired();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("refreshIfExpiring", () => {
    it("makes fetch call if token is expiring", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: true,
        expiresAt: Date.now() + 100000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpiring();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(2);
    });
    it("does not make fetch call if token is not expiring", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: true,
        expiresAt: Date.now() + 10000000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpiring();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
    });
    it("does not make a fetch call if the user is not logged in", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        isLoggedIn: false,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(false);
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpiring();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
    });
  });
});
