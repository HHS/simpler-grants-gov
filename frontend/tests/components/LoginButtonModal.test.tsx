import userEvent from "@testing-library/user-event";
import { LOGIN_URL } from "src/constants/auth";
import { render, screen } from "tests/react-utils";

import { LoginButtonModal } from "src/components/LoginButtonModal";

const usePathnameMock = jest.fn().mockReturnValue("/fakepath");

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock() as string,
  useRouter: () => ({
    refresh: () => undefined,
  }),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("src/hooks/useRouteChange", () => ({
  // eslint-disable-next-line
  useRouteChange: () => {},
}));

describe("LoginButtonModal", () => {
  it("renders", () => {
    render(<LoginButtonModal navLoginLinkText="Sign in" />);
    const loginGovLink = screen.getByRole("link", {
      name: /Sign in with Login.gov/i,
    });
    expect(loginGovLink).toBeInTheDocument();
    expect(loginGovLink).toHaveAttribute("href", LOGIN_URL);

    const modalTitle = screen.getByRole("heading", { level: 2 });
    expect(modalTitle).toHaveTextContent("Sign in to Simpler.Grants.gov");
  });

  it("displays modal when clicked", async () => {
    render(<LoginButtonModal navLoginLinkText="Sign in" />);

    const loginButton = screen.getByRole("button", { name: /Sign in/i });
    expect(loginButton).toBeInTheDocument();

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("is-hidden");

    await userEvent.click(loginButton);
    expect(modal).toHaveClass("is-visible");

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await userEvent.click(cancelButton);
    expect(modal).toHaveClass("is-hidden");
  });
});
