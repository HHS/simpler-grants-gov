import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignOutNavLink } from "./SignOutNavLink";

const mockStoreCurrentPage = jest.fn();

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: () => mockStoreCurrentPage() as unknown,
}));

describe("SignOutNavLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({})) as jest.Mock;
  });

  it("renders Sign out text", () => {
    const onClick = jest.fn();
    render(<SignOutNavLink closeDropdownAndMobileNav={onClick} />);

    expect(screen.getByText("logout")).toBeInTheDocument();
  });

  it("calls closeDropdownAndMobileNav when clicked after logout", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<SignOutNavLink closeDropdownAndMobileNav={onClick} />);

    const signOutLabel = screen.getByText("logout");
    await user.click(signOutLabel);

    await waitFor(() => {
      // gotta figure out how to mock location, may not be possible
      expect(mockStoreCurrentPage).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });
  });
});
