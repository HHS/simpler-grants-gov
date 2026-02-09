import { render, screen } from "@testing-library/react";

import React, { JSX } from "react";

import "@testing-library/jest-dom";

import Page, {
  generateMetadata,
} from "src/app/[locale]/(base)/organizations/[id]/manage-users/page";

type Params = { locale: string; id: string };

// Keep this type minimal so eslint doesn't treat it as propTypes
type ManageUsersPageContentMinimalProps = {
  organizationId: string;
};

const ManageUsersPageContentMock = jest.fn<
  void,
  [ManageUsersPageContentMinimalProps]
>();

jest.mock("src/components/manageUsers/ManageUsersPageContent", () => ({
  ManageUsersPageContent: (props: unknown) => {
    const typedProps = props as ManageUsersPageContentMinimalProps;
    ManageUsersPageContentMock(typedProps);
    return (
      <div data-testid="manage-users-page-content">
        org-id: {typedProps.organizationId}
      </div>
    );
  },
}));

type PageFn = (args: { params: Promise<Params> }) => Promise<JSX.Element>;

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (WrappedComponent: PageFn, _flagName: string, _onDisabled: () => void) =>
    (props: { params: Promise<Params> }) =>
      WrappedComponent(props),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<
  Promise<TranslationFn>,
  [{ locale: string }]
>(({ locale }) =>
  Promise.resolve((key: string) => {
    if (key === "ManageUsers.pageTitle") return "Manage users page title";
    if (key === "Index.metaDescription") {
      return "Manage users meta description";
    }
    return `${key}:${locale}`;
  }),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (opts: { locale: string }) => getTranslationsMock(opts),
}));

// --- AuthorizationGate mock ---

type ResourcePromises = {
  invitedUsersList: Promise<unknown>;
  activeUsersList: Promise<unknown>;
  organizationRolesList: Promise<unknown>;
};

type RequiredPrivilege = {
  resourceId: string;
  resourceType: string;
  privilege: string;
};

const AuthorizationGateMock = jest.fn<void, [unknown]>();

jest.mock("src/components/user/AuthorizationGate", () => ({
  AuthorizationGate: (props: unknown) => {
    AuthorizationGateMock(props);
    const { children } = props as { children: React.ReactNode };
    return <div data-testid="authorization-gate">{children}</div>;
  },
}));

// --- organizationsFetcher mocks ---

type GetOrgPendingInvitationsFn = (organizationId: string) => Promise<unknown>;

type GetOrgUsersFn = (organizationId: string) => Promise<unknown>;

type GetOrgRolesFn = (organizationId: string) => Promise<unknown>;

const getOrganizationPendingInvitationsMock: jest.MockedFunction<GetOrgPendingInvitationsFn> =
  jest.fn<Promise<unknown>, [string]>((_orgId: string) => Promise.resolve([]));

const getOrganizationUsersMock: jest.MockedFunction<GetOrgUsersFn> = jest.fn<
  Promise<unknown>,
  [string]
>((_orgId: string) => Promise.resolve([]));

const getOrganizationRolesMock: jest.MockedFunction<GetOrgRolesFn> = jest.fn<
  Promise<unknown>,
  [string]
>((_orgId: string) => Promise.resolve([]));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationPendingInvitations: (
    ...args: Parameters<GetOrgPendingInvitationsFn>
  ) => getOrganizationPendingInvitationsMock(...args),
  getOrganizationUsers: (...args: Parameters<GetOrgUsersFn>) =>
    getOrganizationUsersMock(...args),
  getOrganizationRoles: (...args: Parameters<GetOrgRolesFn>) =>
    getOrganizationRolesMock(...args),
}));

const PageTyped = Page as unknown as PageFn;

describe("manage-users page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationPendingInvitationsMock.mockResolvedValue([]);
    getOrganizationUsersMock.mockResolvedValue([]);
    getOrganizationRolesMock.mockResolvedValue([]);
  });

  it("renders ManageUsersPageContent with the organizationId from params and wires AuthorizationGate correctly", async () => {
    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const element = await PageTyped({ params });

    render(element);

    expect(screen.getByTestId("manage-users-page-content")).toHaveTextContent(
      "org-id: org-123",
    );
    expect(ManageUsersPageContentMock).toHaveBeenCalledTimes(1);
    const contentProps = ManageUsersPageContentMock.mock.calls[0][0];
    expect(contentProps.organizationId).toBe("org-123");

    expect(AuthorizationGateMock).toHaveBeenCalledTimes(1);
    const gateProps = AuthorizationGateMock.mock.calls[0][0] as {
      resourcePromises: ResourcePromises;
      requiredPrivileges: RequiredPrivilege[];
      onUnauthorized: () => JSX.Element;
    };

    expect(gateProps.requiredPrivileges).toEqual([
      {
        resourceId: "org-123",
        resourceType: "organization",
        privilege: "manage_org_members",
      },
    ]);

    expect(getOrganizationPendingInvitationsMock).toHaveBeenCalledWith(
      "org-123",
    );
    expect(getOrganizationUsersMock).toHaveBeenCalledWith("org-123");
    expect(getOrganizationRolesMock).toHaveBeenCalledWith("org-123");

    expect(gateProps.resourcePromises).toHaveProperty("invitedUsersList");
    expect(gateProps.resourcePromises).toHaveProperty("activeUsersList");
    expect(gateProps.resourcePromises).toHaveProperty("organizationRolesList");
  });

  it("generateMetadata returns translated title and description", async () => {
    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const meta = await generateMetadata({ params });

    expect(meta).toEqual({
      title: "Manage users page title",
      description: "Manage users meta description",
    });
  });
});