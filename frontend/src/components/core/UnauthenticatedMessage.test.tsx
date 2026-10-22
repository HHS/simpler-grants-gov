import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { UnauthenticatedMessage } from "src/components/core/UnauthenticatedMessage";

const mockStoreCurrentPage = jest.fn();

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: (...args: unknown[]) =>
    mockStoreCurrentPage(...args) as unknown,
}));

describe("UnauthenticatedMessage", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the signed-out message with sign in and create account actions", () => {
    render(<UnauthenticatedMessage />);

    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
    expect(screen.getByText("signInCTA")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "signIn" })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
    expect(screen.getByRole("link", { name: "createAccount" })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
  });

  it("does not start authentication without user action", () => {
    render(<UnauthenticatedMessage />);
    expect(mockStoreCurrentPage).not.toHaveBeenCalled();
  });

  it.each(["signIn", "createAccount"])(
    "stores the current page when %s is clicked",
    async (linkName) => {
      render(<UnauthenticatedMessage />);
      await userEvent.click(screen.getByRole("link", { name: linkName }));
      expect(mockStoreCurrentPage).toHaveBeenCalledTimes(1);
    },
  );

  it("passes accessibility scan", async () => {
    const { container } = render(<UnauthenticatedMessage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
