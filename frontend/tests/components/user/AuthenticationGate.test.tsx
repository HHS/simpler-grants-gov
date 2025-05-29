import { identity } from "lodash";
import { render, screen } from "tests/react-utils";

import { JSX } from "react";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

const mockGetSession = jest.fn();
const mockParamGet = jest.fn();
const mockRedirect = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (): unknown => mockParamGet(),
  }),
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("AuthenticationGate", () => {
  afterEach(() => jest.clearAllMocks());
  it("renders children if logged in", async () => {
    mockGetSession.mockResolvedValue({ token: "a token" });
    const component = await AuthenticationGate({
      children: <div>HELLO</div>,
    });
    render(component as JSX.Element);
    expect(screen.getByText("HELLO")).toBeInTheDocument();
  });
  it("renders AuthenticationGate if not logged in without auth_logout=ok", async () => {
    mockGetSession.mockReturnValue({ token: undefined });
    mockParamGet.mockReturnValue(null);
    const component = await AuthenticationGate({
      children: <div>HELLO</div>,
    });
    render(component as JSX.Element);
    expect(screen.queryByText("HELLO")).not.toBeInTheDocument();
  });

  it("redirects to the homepage if not logged in", async () => {
    mockGetSession.mockReturnValue({ token: undefined });
    mockParamGet.mockReturnValue("ok");
    // redirect("/")
    mockRedirect.mockImplementation((url: string) => {
      return url;
    });
    const component = await AuthenticationGate({
      children: <div>HELLO</div>,
    });
    render(component as JSX.Element);
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });
});
