import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  formatTimeRemaining,
  getWarningDelayMs,
  SessionExpirationWarning,
} from "src/components/core/SessionExpirationWarning";

const mockUseUser = jest.fn();
const mockRefreshUser = jest.fn(() => Promise.resolve());

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser() as unknown,
}));

const userContext = (
  expiresAt: number | undefined,
  { isLoggedIn = true, enabled = true } = {},
) => ({
  user: { isLoggedIn, expiresAt },
  featureFlags: { enableSessionExpirationAlerts: enabled },
  refreshUser: mockRefreshUser,
});

const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

const dialog = () => screen.getByRole("dialog", { hidden: true });

describe("getWarningDelayMs", () => {
  it.each([
    [15 * 60 * 1000, 13 * 60 * 1000],
    [60 * 1000, 30 * 1000],
    [4 * 60 * 1000, 2 * 60 * 1000],
  ])("warns before a %pms session at %pms", (remaining, expected) => {
    expect(getWarningDelayMs(remaining, 0)).toEqual(expected);
  });
});

describe("formatTimeRemaining", () => {
  it.each([
    [120000, "2:00"],
    [90000, "1:30"],
    [1, "0:01"],
    [0, "0:00"],
    [-5000, "0:00"],
  ])("formats %pms as %p", (ms, expected) => {
    expect(formatTimeRemaining(ms)).toEqual(expected);
  });
});

describe("SessionExpirationWarning", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("opens shortly before the session expires", async () => {
    mockUseUser.mockReturnValue(userContext(Date.now() + 15 * 60 * 1000));
    render(<SessionExpirationWarning />);

    await advance(13 * 60 * 1000 - 1000);
    expect(dialog()).toHaveClass("is-hidden");

    await advance(1000);
    expect(dialog()).toHaveClass("is-visible");
    expect(screen.getByRole("timer", { hidden: true })).toBeInTheDocument();
  });

  it("stays closed when the flag is off", async () => {
    mockUseUser.mockReturnValue(
      userContext(Date.now() + 60 * 1000, { enabled: false }),
    );
    render(<SessionExpirationWarning />);

    await advance(60 * 1000);

    expect(dialog()).toHaveClass("is-hidden");
  });

  it("stays closed for a signed out user", async () => {
    mockUseUser.mockReturnValue(
      userContext(Date.now() + 60 * 1000, { isLoggedIn: false }),
    );
    render(<SessionExpirationWarning />);

    await advance(60 * 1000);

    expect(dialog()).toHaveClass("is-hidden");
  });

  it("refreshes the session and closes when the user stays signed in", async () => {
    jest.useRealTimers();
    mockUseUser.mockReturnValue(userContext(Date.now() + 200));
    render(<SessionExpirationWarning />);
    await waitFor(() => expect(dialog()).toHaveClass("is-visible"));

    await userEvent.click(
      screen.getByRole("button", { name: "staySignedIn", hidden: true }),
    );

    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog()).toHaveClass("is-hidden"));
  });

  it("closes when the session is refreshed elsewhere", async () => {
    const expiresAt = Date.now() + 60 * 1000;
    mockUseUser.mockReturnValue(userContext(expiresAt));
    const { rerender } = render(<SessionExpirationWarning />);
    await advance(30 * 1000);
    expect(dialog()).toHaveClass("is-visible");

    mockUseUser.mockReturnValue(userContext(expiresAt + 60 * 1000));
    rerender(<SessionExpirationWarning />);

    expect(dialog()).toHaveClass("is-hidden");
  });

  it("closes when the user is logged out", async () => {
    const expiresAt = Date.now() + 60 * 1000;
    mockUseUser.mockReturnValue(userContext(expiresAt));
    const { rerender } = render(<SessionExpirationWarning />);
    await advance(30 * 1000);
    expect(dialog()).toHaveClass("is-visible");

    mockUseUser.mockReturnValue(userContext(expiresAt, { isLoggedIn: false }));
    rerender(<SessionExpirationWarning />);

    expect(dialog()).toHaveClass("is-hidden");
  });

  it("links sign out to the logout route", () => {
    mockUseUser.mockReturnValue(userContext(Date.now() + 60 * 1000));
    render(<SessionExpirationWarning />);

    expect(
      screen.getByRole("link", { name: "signOut", hidden: true }),
    ).toHaveAttribute("href", "/api/auth/logout");
  });

  it("passes accessibility scan when open", async () => {
    jest.useRealTimers();
    mockUseUser.mockReturnValue(userContext(Date.now() + 200));
    render(<SessionExpirationWarning />);
    await waitFor(() => expect(dialog()).toHaveClass("is-visible"));

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
