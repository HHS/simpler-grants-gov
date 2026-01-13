import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginButton, LoginLink } from "src/components/LoginButton";

const mockStoreCurrentPage = jest.fn();

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: () => mockStoreCurrentPage() as unknown,
}));

describe("LoginLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call store location to session storage when clicking sign in", async () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    const signInButton = screen.getByText("hi");
    await userEvent.click(signInButton);

    expect(mockStoreCurrentPage).toHaveBeenCalled();
  });
});
