import { render, screen } from "@testing-library/react";
import ApiDashboardLayout from "src/app/[locale]/(base)/developers/api-dashboard/layout";
import NotificationsLayout from "src/app/[locale]/(base)/notifications/layout";
import SettingsLayout from "src/app/[locale]/(base)/settings/layout";
import WorkspaceLayout from "src/app/[locale]/(base)/workspace/layout";
import { LayoutProps } from "src/types/generalTypes";

import { JSX, ReactElement, ReactNode } from "react";

const mockGetSession = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("src/components/core/UnauthenticatedMessage", () => ({
  UnauthenticatedMessage: () => <div>SHARED SIGNED OUT MESSAGE</div>,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

// layouts return the async AuthenticationGate server component, resolve it before rendering
const renderLayout = async (
  Layout: (props: LayoutProps) => ReactElement,
  children: ReactNode,
) => {
  const element = Layout({ children } as LayoutProps) as ReactElement<{
    children: ReactNode;
  }>;
  const Gate = element.type as (props: {
    children: ReactNode;
  }) => Promise<ReactNode>;
  render((await Gate(element.props)) as JSX.Element);
};

describe.each([
  ["/workspace", WorkspaceLayout],
  ["/settings", SettingsLayout],
  ["/notifications", NotificationsLayout],
  ["/developers/api-dashboard", ApiDashboardLayout],
])("%s layout", (_, Layout) => {
  afterEach(() => jest.clearAllMocks());

  it("renders the shared signed-out message instead of the page when signed out", async () => {
    mockGetSession.mockResolvedValue(null);

    await renderLayout(Layout, <div>GATED CONTENT</div>);

    expect(screen.getByText("SHARED SIGNED OUT MESSAGE")).toBeInTheDocument();
    expect(screen.queryByText("GATED CONTENT")).not.toBeInTheDocument();
  });

  it("renders the page when signed in", async () => {
    mockGetSession.mockResolvedValue({ token: "a token" });

    await renderLayout(Layout, <div>GATED CONTENT</div>);

    expect(screen.getByText("GATED CONTENT")).toBeInTheDocument();
    expect(
      screen.queryByText("SHARED SIGNED OUT MESSAGE"),
    ).not.toBeInTheDocument();
  });
});
