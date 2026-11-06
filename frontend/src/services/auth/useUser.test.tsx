import { render, renderHook, screen, waitFor } from "@testing-library/react";
import UserProvider from "src/services/auth/UserProvider";
import { useUser } from "src/services/auth/useUser";

import { PropsWithChildren } from "react";

const debouncedUserFetcherMock = jest.fn();
const routerRefreshMock = jest.fn();
const mockPostUserEvent = jest.fn();
const mockRouter = { refresh: () => routerRefreshMock() as unknown };

jest.mock("src/services/fetch/fetchers/clientUserFetcher", () => ({
  debouncedUserFetcher: () => debouncedUserFetcherMock() as unknown,
}));

jest.mock("src/services/event/postUserEvent", () => ({
  postUserEvent: (event: unknown) => mockPostUserEvent(event) as unknown,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("src/constants/auth", () => ({
  clientTokenRefreshInterval: 10 * 60 * 1000,
  clientTokenExpirationInterval: 15 * 60 * 1000,
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
  it("sets user as logged out and refreshes the router if second fetch for user comes back logged out", async () => {
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
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });
  it("does not refresh the router when the user remains logged in", async () => {
    debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: true });
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(true);
    });

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.isLoading).toEqual(false);
    });
    expect(result.current.user?.isLoggedIn).toEqual(true);
    expect(result.current.hasBeenLoggedOut).toEqual(false);
    expect(routerRefreshMock).not.toHaveBeenCalled();
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
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
  it("keeps a logged in user when a session refresh fails with a network or server error", async () => {
    debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: true });
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.isLoggedIn).toEqual(true);
    });

    debouncedUserFetcherMock.mockRejectedValue(
      new Error("Unable to fetch user: 500"),
    );

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.user?.isLoggedIn).toEqual(true);
    expect(result.current.hasBeenLoggedOut).toEqual(false);
    expect(routerRefreshMock).not.toHaveBeenCalled();
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

  describe("session_expired", () => {
    const renderSignedIn = async (expiresAt: number) => {
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: true, expiresAt });
      const { result } = renderHook(() => useUser(), { wrapper });
      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(true);
      });
      return { result };
    };

    it("reports an expired session once when concurrent checks see it signed out", async () => {
      const { result } = await renderSignedIn(Date.now() - 1000);
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });

      const { refreshIfExpired } = result.current;
      await Promise.all([refreshIfExpired(), refreshIfExpired()]);

      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(false);
      });
      await result.current.refreshUser();

      expect(mockPostUserEvent).toHaveBeenCalledTimes(1);
      expect(mockPostUserEvent).toHaveBeenCalledWith({
        name: "session_expired",
      });
    });

    it("does not report an anonymous visitor", async () => {
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });
      const { result } = renderHook(() => useUser(), { wrapper });
      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(false);
      });

      await result.current.refreshUser();
      await result.current.refreshIfExpired();

      expect(mockPostUserEvent).not.toHaveBeenCalled();
    });

    it("does not report a signed out response before the session expiry time", async () => {
      const { result } = await renderSignedIn(Date.now() + 60 * 60 * 1000);
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });

      await result.current.refreshUser();

      await waitFor(() => {
        expect(result.current.hasBeenLoggedOut).toEqual(true);
      });
      expect(mockPostUserEvent).not.toHaveBeenCalled();
    });

    it("does not report a failed session request", async () => {
      const { result } = await renderSignedIn(Date.now() - 1000);
      debouncedUserFetcherMock.mockRejectedValue(
        new Error("Unable to fetch user: 500"),
      );

      await result.current.refreshIfExpired();

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
      expect(mockPostUserEvent).not.toHaveBeenCalled();
    });

    it("does not report a local logout", async () => {
      const { result } = await renderSignedIn(Date.now() - 1000);

      result.current.logoutLocalUser();
      await waitFor(() => {
        expect(result.current.user?.isLoggedIn).toEqual(false);
      });
      debouncedUserFetcherMock.mockReturnValue({ isLoggedIn: false });
      await result.current.refreshUser();

      expect(mockPostUserEvent).not.toHaveBeenCalled();
    });
  });
});
