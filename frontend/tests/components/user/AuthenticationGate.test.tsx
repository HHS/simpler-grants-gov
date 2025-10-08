import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen } from "tests/react-utils";

import { JSX } from "react";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

const mockGetSession = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
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

  it("renders unauthenticated message if not logged in", async () => {
    mockGetSession.mockReturnValue({ token: undefined });
    const component = await AuthenticationGate({
      children: <div>HELLO</div>,
    });
    render(component as JSX.Element);
    expect(screen.queryByText("HELLO")).not.toBeInTheDocument();
  });
});
