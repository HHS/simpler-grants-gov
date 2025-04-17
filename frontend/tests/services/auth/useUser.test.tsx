import { render, screen, waitFor } from "@testing-library/react";
import identity from "lodash/identity";
import UserProvider from "src/services/auth/UserProvider";
import { useUser } from "src/services/auth/useUser";

const userFetcherMock = jest.fn();

jest.mock("src/services/fetch/fetchers/clientUserFetcher", () => ({
  userFetcher: () => userFetcherMock() as unknown,
}));

jest.mock("lodash/debounce", () => identity);

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

describe("useUser", () => {
  afterEach(() => jest.clearAllMocks());
  it("renders with the expected state on successful fetch", async () => {
    userFetcherMock.mockResolvedValue("this is where a user would be");

    render(
      <UserProvider>
        <UseUserConsumer />
      </UserProvider>,
    );

    const errorDisplay = await screen.findByTestId("error");
    const userDisplay = await screen.findByTestId("user");

    await waitFor(() => {
      expect(userDisplay).toHaveTextContent("this is where a user would be");
    });

    expect(errorDisplay).toBeEmptyDOMElement();
    expect(userFetcherMock).toHaveBeenCalledTimes(1);
  });

  it("renders with the expected state on error", async () => {
    userFetcherMock.mockResolvedValue(null);
    render(
      <UserProvider>
        <UseUserConsumer />
      </UserProvider>,
    );

    const errorDisplay = await screen.findByTestId("error");
    const userDisplay = await screen.findByTestId("user");

    await waitFor(() => {
      expect(errorDisplay).not.toBeEmptyDOMElement();
    });

    expect(userDisplay).toBeEmptyDOMElement();
    expect(userFetcherMock).toHaveBeenCalledTimes(1);
  });
});
