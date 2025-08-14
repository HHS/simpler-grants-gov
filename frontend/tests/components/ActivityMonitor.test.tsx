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
  // let originalAddEventListener: typeof global.document.addEventListener;
  // let originalRemoveEventListener: typeof global.document.removeEventListener;

  beforeEach(() => {
    mockAddEventListener = jest.spyOn(document, "addEventListener");
    mockRemoveEventListener = jest.spyOn(document, "removeEventListener");
    // originalAddEventListener = global.document.addEventListener;
    // originalRemoveEventListener = global.document.removeEventListener;
    // Object.defineProperty(
    //   global.document,
    //   "addEventListener",
    //   mockAddEventListener,
    // );
    // Object.defineProperty(
    //   global.document,
    //   "removeEventListener",
    //   mockRemoveEventListener,
    // );
  });

  afterEach(() => {
    // Object.defineProperty(
    //   global.document,
    //   "addEventListener",
    //   originalAddEventListener,
    // );
    // Object.defineProperty(
    //   global.document,
    //   "removeEventListener",
    //   originalRemoveEventListener,
    // );
    jest.clearAllMocks();
    // jest.resetAllMocks();
    // mockRefreshIfExpired.mockClear();
    // mockRefreshIfExpiring.mockClear();
    // mockRefreshIfExpired.mockReset();
    // mockRefreshIfExpiring.mockReset();
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
  it.only("calls refreshIfExpiring, refreshIfExpired, when clicking after handlers are added and token is not expired", async () => {
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
  it("calls refreshIfExpiring, logoutLocalUser when clicking after handlers are added and token is expired", async () => {
    mockRefreshIfExpired.mockResolvedValue(true);
    fakeUser = { token: "" };
    const { rerender } = render(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );
    await userEvent.click(screen.getByTestId("div"));

    expect(mockRefreshIfExpired).not.toHaveBeenCalled();
    expect(mockLogoutLocalUser).not.toHaveBeenCalled();

    fakeUser = { token: "logged in" };
    rerender(
      <>
        <ActivityMonitor />
        <div data-testid="div"></div>
      </>,
    );

    await userEvent.click(screen.getByTestId("div"));

    await waitFor(() => expect(mockRefreshIfExpired).toHaveBeenCalled());
    await waitFor(() => expect(mockLogoutLocalUser).toHaveBeenCalled());
  });
  it("does not call refreshIfExpiring, refreshIfExpired, logoutLocal user, when clicking before handlers are added", () => {});
  it("does not call refreshIfExpiring, refreshIfExpired, logoutLocal user, when clicking after handlers are removed", () => {});
});
