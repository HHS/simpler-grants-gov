import { render } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import type { AuthorizedData } from "src/types/authTypes";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_ns: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

type GetOrgDetailsFn = (orgId: string) => Promise<unknown>;

const getOrganizationDetailsMock: jest.MockedFunction<GetOrgDetailsFn> =
  jest.fn<Promise<unknown>, [string]>();

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationDetails: (...args: Parameters<GetOrgDetailsFn>) =>
    getOrganizationDetailsMock(...args),
}));

type Breadcrumb = { title: string; path: string };
type BreadcrumbsProps = { breadcrumbList: Breadcrumb[] };

const BreadcrumbsMock = jest.fn<void, [BreadcrumbsProps]>();

jest.mock("src/components/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: BreadcrumbsProps) => {
    BreadcrumbsMock(props);
    return <nav data-testid="breadcrumbs" />;
  },
}));

type PageHeaderProps = { organizationName?: string };

const PageHeaderMock = jest.fn<void, [PageHeaderProps]>();

jest.mock("src/components/manageUsers/PageHeader", () => ({
  PageHeader: (props: unknown) => {
    PageHeaderMock(props as PageHeaderProps);
    return <div data-testid="page-header" />;
  },
}));

type UserOrganizationInviteProps = { organizationId: string };

const UserOrganizationInviteMock = jest.fn<
  void,
  [UserOrganizationInviteProps]
>();

jest.mock("src/components/manageUsers/UserOrganizationInvite", () => ({
  UserOrganizationInvite: (props: unknown) => {
    UserOrganizationInviteMock(props as UserOrganizationInviteProps);
    return <div data-testid="user-org-invite" />;
  },
}));

const authorizedDataStub: AuthorizedData = {
  fetchedResources: {
    activeUsersList: {
      data: [],
      statusCode: 200,
    },
    invitedUsersList: {
      data: [],
      statusCode: 200,
    },
  },
  confirmedPrivileges: [],
};

// --- tests ---

describe("ManageUsersPageContent", () => {
  const organizationId = "org-123";

  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationDetailsMock.mockResolvedValue({});
  });

  it("renders breadcrumbs and header with the organization name when fetch succeeds", async () => {
    getOrganizationDetailsMock.mockResolvedValueOnce({
      sam_gov_entity: { legal_business_name: "Cool Org Inc" },
    });

    const component = await ManageUsersPageContent({
      organizationId,
      authorizedData: authorizedDataStub,
    });
    render(component);

    expect(BreadcrumbsMock).toHaveBeenCalledTimes(1);
    const breadcrumbsProps = BreadcrumbsMock.mock.calls[0][0];
    expect(breadcrumbsProps.breadcrumbList).toHaveLength(4);
    expect(breadcrumbsProps.breadcrumbList[2]).toEqual({
      title: "Cool Org Inc",
      path: `/organization/${organizationId}`,
    });

    expect(PageHeaderMock).toHaveBeenCalledTimes(1);
    const pageHeaderProps = PageHeaderMock.mock.calls[0][0];
    expect(pageHeaderProps.organizationName).toBe("Cool Org Inc");

    expect(UserOrganizationInviteMock).toHaveBeenCalledTimes(1);
    const inviteProps = UserOrganizationInviteMock.mock.calls[0][0];
    expect(inviteProps.organizationId).toBe(organizationId);
  });

  it('falls back to "Organization" when fetching org details fails', async () => {
    getOrganizationDetailsMock.mockRejectedValueOnce(
      new Error("Unable to fetch org"),
    );

    const component = await ManageUsersPageContent({
      organizationId,
      authorizedData: authorizedDataStub,
    });
    render(component);

    expect(BreadcrumbsMock).toHaveBeenCalledTimes(1);
    const breadcrumbsProps = BreadcrumbsMock.mock.calls[0][0];
    expect(breadcrumbsProps.breadcrumbList[2]).toEqual({
      title: "Organization",
      path: `/organization/${organizationId}`,
    });

    expect(PageHeaderMock).toHaveBeenCalledTimes(1);
    const pageHeaderProps = PageHeaderMock.mock.calls[0][0];
    expect(pageHeaderProps.organizationName).toBeUndefined();
  });
});
