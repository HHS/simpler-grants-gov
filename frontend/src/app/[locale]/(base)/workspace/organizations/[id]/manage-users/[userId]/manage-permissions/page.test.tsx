import { render, screen } from "@testing-library/react";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { ReactNode } from "react";

import Page, { generateMetadata } from "./page";

type PageProps = {
  params: Promise<{ locale: string; id: string; userId: string }>;
};

let flagEnabled = false;

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: jest.fn(
    (
      WrappedComponent: (props: PageProps) => ReactNode,
      _flagName: string,
      onEnabled: (props: PageProps) => ReactNode,
    ) =>
      (props: PageProps) =>
        flagEnabled ? onEnabled(props) : WrappedComponent(props),
  ),
}));

// captured before beforeEach clears mock calls
const flagNameUsed = jest.mocked(withFeatureFlag).mock.calls[0][1];

const notFoundMock = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const authorizationGateMock = jest.fn<void, [unknown]>();

jest.mock("src/components/core/AuthorizationGate", () => ({
  AuthorizationGate: (props: { children: ReactNode }) => {
    authorizationGateMock(props);
    return <div data-testid="authorization-gate">{props.children}</div>;
  },
}));

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/[userId]/manage-permissions/_components/ManagePermissionsPageContent",
  () => ({
    ManagePermissionsPageContent: ({
      organizationId,
    }: {
      organizationId: string;
    }) => <div data-testid="page-content">{organizationId}</div>,
  }),
);

const props: PageProps = {
  params: Promise.resolve({ locale: "en", id: "org-1", userId: "user-1" }),
};

const renderPage = async () => {
  const PageComponent = Page as unknown as (props: PageProps) => ReactNode;
  const element = PageComponent(props) as {
    type: (props: PageProps) => Promise<ReactNode>;
    props: PageProps;
  };
  // onEnabled returns <ManagePermissionsPage />, an async server component
  return render(await element.type(element.props));
};

describe("Manage permissions page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is gated by the enableExternalCollaborators flag", () => {
    expect(flagNameUsed).toBe("enableExternalCollaborators");
  });

  it("returns a 404 when the feature flag is off", () => {
    flagEnabled = false;
    const PageComponent = Page as unknown as (props: PageProps) => ReactNode;

    expect(() => PageComponent(props)).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
    expect(authorizationGateMock).not.toHaveBeenCalled();
  });

  it("requires manage_org_members on the organization when the flag is on", async () => {
    flagEnabled = true;
    await renderPage();

    expect(screen.getByTestId("page-content")).toHaveTextContent("org-1");
    expect(authorizationGateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requiredPrivileges: [
          {
            resourceId: "org-1",
            resourceType: "organization",
            privilege: "manage_org_members",
          },
        ],
      }),
    );
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("sets the page title", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.title).toBe("ManagePermissions.pageTitle");
  });
});
