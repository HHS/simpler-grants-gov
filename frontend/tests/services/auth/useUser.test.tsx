import { render, renderHook, screen, waitFor } from "@testing-library/react";
import UserProvider from "src/services/auth/UserProvider";
import { useUser } from "src/services/auth/useUser";

import { PropsWithChildren } from "react";

const debouncedUserFetcherMock = jest.fn();

jest.mock("src/services/fetch/fetchers/clientUserFetcher", () => ({
  debouncedUserFetcher: () => debouncedUserFetcherMock() as unknown,
}));

const UseUserConsumer = () => {
  const { error, isLoading, user } = useUser();
  return (
    <>
      <div data-testid="error">{error?.toString() || ""}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="user">{user?.toString() || ""}</div>
    </>
  );
};

const renderWrappedConsumer = () => {
  const { rerender } = render(
    <UserProvider>
      <UseUserConsumer />
    </UserProvider>,
  );
  return () =>
    rerender(
      <UserProvider>
        <UseUserConsumer />
      </UserProvider>,
    );
};

const wrapper = ({ children }: PropsWithChildren) => (
  <UserProvider>{children}</UserProvider>
);

describe("useUser", () => {
  afterEach(() => jest.clearAllMocks());
  it("renders with the expected state on successful fetch", async () => {
    debouncedUserFetcherMock.mockResolvedValue("this is where a user would be");

    renderWrappedConsumer();

    const errorDisplay = await screen.findByTestId("error");
    const userDisplay = await screen.findByTestId("user");

    await waitFor(() => {
      expect(userDisplay).toHaveTextContent("this is where a user would be");
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
  it("sets user as logged out if second fetch for user comes back without a token", async () => {
    debouncedUserFetcherMock.mockReturnValue({ token: "a token" });
    const wrapper = ({ children }: PropsWithChildren) => (
      <UserProvider>{children}</UserProvider>
    );
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.token).toEqual("a token");
    });

    expect(result.current.hasBeenLoggedOut).toEqual(false);

    debouncedUserFetcherMock.mockReturnValue({ token: "" });

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.user?.token).toEqual("");
    });
    expect(result.current.hasBeenLoggedOut).toEqual(true);
  });
  describe("logoutLocalUser", () => {
    it("removes user token", async () => {
      debouncedUserFetcherMock.mockReturnValue({ token: "a token" });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.token).toEqual("a token");
      });

      result.current.logoutLocalUser();

      await waitFor(() => expect(result.current.user?.token).toEqual(""));
    });
  });
  describe("refreshIfExpired", () => {
    it("makes fetch call if token is expired", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        token: "a token",
        expiresAt: Date.now() - 10000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.token).toEqual("a token");
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpired();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(2);
    });
    it("does not make fetch call if token is not expired", async () => {
      debouncedUserFetcherMock.mockReturnValue({
        token: "a token",
        expiresAt: Date.now() + 10000,
      });
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.token).toEqual("a token");
      });

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);

      await result.current.refreshIfExpired();

      expect(debouncedUserFetcherMock).toHaveBeenCalledTimes(1);
    });
  });
});
