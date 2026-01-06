import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActivityMonitor } from "src/components/ActivityMonitor";

let mockAddEventListener = jest.spyOn(document, "addEventListener");
let mockRemoveEventListener = jest.spyOn(document, "addEventListener");
const mockRefreshIfExpired = jest.fn();
const mockRefreshIfExpiring = jest.fn();
const mockLogoutLocalUser = jest.fn();

let fakeUser = {};

const getUser = () => fakeUser;

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    user: getUser(),
    refreshIfExpiring: () => mockRefreshIfExpiring() as unknown,
    refreshIfExpired: () => mockRefreshIfExpired() as unknown,
    logoutLocalUser: () => mockLogoutLocalUser() as unknown,
  }),
}));

describe("ActivityMonitor", () => {
  beforeEach(() => {
    mockAddEventListener = jest.spyOn(document, "addEventListener");
    mockRemoveEventListener = jest.spyOn(document, "removeEventListener");
    // not sure why we have to clear mocks before the test, but without this the even listener mocks are not properly cleared
    // likely because of the reassignment of the mock listener variables, rather than creating new ones
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("adds handlers when logging in", () => {
    const { rerender } = render(<ActivityMonitor />);

    expect(mockAddEventListener).not.toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
    fakeUser = { token: "logged in" };
    rerender(<ActivityMonitor />);
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
  });
  it("removes handlers when logging out", () => {
    fakeUser = { token: "logged in" };
    const { rerender } = render(<ActivityMonitor />);

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
    expect(mockRemoveEventListener).not.toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );

    fakeUser = { token: "" };
    rerender(<ActivityMonitor />);
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
  });
  it("calls refreshIfExpiring, refreshIfExpired, when clicking after handlers are added and token is not expired", async () => {
    mockRefreshIfExpired.mockResolvedValue(false);
    fakeUser = { token: "" };
    const { rerender } = render(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );
    await userEvent.click(screen.getByTestId("div"));

    expect(mockRefreshIfExpired).not.toHaveBeenCalled();
    expect(mockRefreshIfExpiring).not.toHaveBeenCalled();

    fakeUser = { token: "logged in" };
    rerender(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );

    await userEvent.click(screen.getByTestId("div"));

    await waitFor(() => expect(mockRefreshIfExpired).toHaveBeenCalled());
    await waitFor(() => expect(mockRefreshIfExpiring).toHaveBeenCalled());
  });
  it("calls refreshIfExpired, logoutLocalUser when clicking after handlers are added and token is expired", async () => {
    mockRefreshIfExpired.mockResolvedValue(true);
    fakeUser = { token: "logged in" };
    render(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );

    await userEvent.click(screen.getByTestId("div"));

    await waitFor(() => expect(mockRefreshIfExpired).toHaveBeenCalled());
    await waitFor(() => expect(mockLogoutLocalUser).toHaveBeenCalled());
  });
  it("does not call refreshIfExpiring, refreshIfExpired, logoutLocal user, when clicking before handlers are added", async () => {
    fakeUser = { token: "" };
    render(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );
    await userEvent.click(screen.getByTestId("div"));

    expect(mockRefreshIfExpired).not.toHaveBeenCalled();
    expect(mockLogoutLocalUser).not.toHaveBeenCalled();
  });
  it("does not call refreshIfExpiring, refreshIfExpired, logoutLocal user, when clicking after handlers are removed", async () => {
    fakeUser = { token: "logged in" };
    const { rerender } = render(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );
    await userEvent.click(screen.getByTestId("div"));

    expect(mockRefreshIfExpired).toHaveBeenCalledTimes(1);
    expect(mockLogoutLocalUser).toHaveBeenCalledTimes(1);

    fakeUser = { token: "" };
    rerender(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );

    await userEvent.click(screen.getByTestId("div"));

    expect(mockRefreshIfExpired).toHaveBeenCalledTimes(1);
    expect(mockLogoutLocalUser).toHaveBeenCalledTimes(1);
  });
});
