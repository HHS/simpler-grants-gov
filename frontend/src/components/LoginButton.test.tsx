import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LOGIN_URL } from "src/constants/auth";
import { LoginButton, LoginLink } from "src/components/LoginButton";

const mockStoreCurrentPage = jest.fn();

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: () => mockStoreCurrentPage(),
}));

describe("LoginButton", () => {
  it("renders a login link with provided text", () => {
    render(<LoginButton navLoginLinkText="Sign in" />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      LOGIN_URL,
    );
  });
});

describe("LoginLink", () => {
  beforeEach(() => jest.clearAllMocks());

  it("navigates to LOGIN_URL", () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    expect(screen.getByRole("link", { name: "hi" })).toHaveAttribute(
      "href",
      LOGIN_URL,
    );
  });

  it("calls storeCurrentPage when clicked", async () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    await userEvent.click(screen.getByRole("link", { name: "hi" }));
    expect(mockStoreCurrentPage).toHaveBeenCalledTimes(1);
  });
});
