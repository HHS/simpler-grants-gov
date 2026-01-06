import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LOGIN_URL } from "src/constants/auth";
import { LoginButton, LoginLink } from "src/components/LoginButton";
import * as userUtils from "src/utils/userUtils";

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: jest.fn(),
}));

const storeCurrentPageMock = jest.mocked(
  userUtils.storeCurrentPage,
) as jest.MockedFunction<typeof userUtils.storeCurrentPage>;

describe("LoginButton", () => {
  beforeEach(() => jest.clearAllMocks());

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
    const user = userEvent.setup();

    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    await user.click(screen.getByRole("link", { name: "hi" }));

    expect(storeCurrentPageMock).toHaveBeenCalledTimes(1);
  });
});
