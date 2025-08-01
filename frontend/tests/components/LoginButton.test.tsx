import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginButton, LoginLink } from "src/components/LoginButton";

const mockSetItem = jest.fn<void, [string, string]>();

jest.mock("src/services/sessionStorage/sessionStorage", () => {
  return {
    __esModule: true,
    default: {
      setItem: (key: string, value: string): void => mockSetItem(key, value),
    },
  };
});

const mockLocation = {
  pathname: "/test-path",
  search: "?param=value",
};

// Save the original location
const originalLocation = global.location;

describe("LoginButton", () => {
  it("matches snapshot", () => {
    const { container } = render(<LoginButton navLoginLinkText="whatever" />);

    expect(container).toMatchSnapshot();
  });
});

describe("LoginLink", () => {
  beforeEach(() => {
    Object.defineProperty(global, "location", {
      configurable: true,
      value: { ...mockLocation },
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(global, "location", {
      configurable: true,
      value: originalLocation,
      writable: true,
    });
  });
  it("matches snapshot", () => {
    const { container } = render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    expect(container).toMatchSnapshot();
  });
  it("should store the current URL in session storage when clicking sign in", async () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    const signInButton = screen.getByText("hi");
    await userEvent.click(signInButton);

    expect(mockSetItem).toHaveBeenCalledWith(
      "login-redirect",
      "/test-path?param=value",
    );
  });

  it("should not store URL in session storage if pathname and search are empty", async () => {
    Object.defineProperty(global, "location", {
      value: { pathname: "", search: "" },
    });

    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    const loginButton = screen.getByText("hi");
    await userEvent.click(loginButton);

    expect(mockSetItem).not.toHaveBeenCalled();
  });
});
