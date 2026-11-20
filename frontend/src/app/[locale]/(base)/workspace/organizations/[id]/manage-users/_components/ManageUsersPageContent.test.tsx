import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { ManageUsersPageContent } from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/ManageUsersPageContent";
import type { AuthorizedData } from "src/types/authTypes";
import { mockUseTranslations } from "src/utils/testing/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
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

jest.mock("src/components/core/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: BreadcrumbsProps) => {
    BreadcrumbsMock(props);
    return <nav data-testid="breadcrumbs" />;
  },
}));

type PageHeaderProps = { organizationName?: string };

const PageHeaderMock = jest.fn<void, [PageHeaderProps]>();

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/PageHeader",
  () => ({
    PageHeader: (props: unknown) => {
      PageHeaderMock(props as PageHeaderProps);
      return <div data-testid="page-header" />;
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/InviteLegacyUsersButton",
  () => ({
    InviteLegacyUsersButton: () => <button>InviteLegacyUsersButton</button>,
  }),
);

type UserOrganizationInviteProps = { organizationId: string };

const UserOrganizationInviteMock = jest.fn<
  void,
  [UserOrganizationInviteProps]
>();

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/UserOrganizationInvite",
  () => ({
    UserOrganizationInvite: (props: unknown) => {
      UserOrganizationInviteMock(props as UserOrganizationInviteProps);
      return <div data-testid="user-org-invite" />;
    },
  }),
);

type ActiveUsersSectionProps = {
  organizationId: string;
  showManagePermissions: boolean;
};

const ActiveUsersSectionMock = jest.fn<void, [ActiveUsersSectionProps]>();

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/ActiveUsersSection",
  () => ({
    ActiveUsersSection: (props: unknown) => {
      ActiveUsersSectionMock(props as ActiveUsersSectionProps);
      return <div data-testid="active-users-section" />;
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/InvitedUsersSection",
  () => ({
    InvitedUsersSection: () => <div data-testid="invited-users-section" />,
  }),
);

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
    organizationRolesList: {
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
      path: `/workspace/organizations/${organizationId}`,
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
      path: `/workspace/organizations/${organizationId}`,
    });

    expect(PageHeaderMock).toHaveBeenCalledTimes(1);
    const pageHeaderProps = PageHeaderMock.mock.calls[0][0];
    expect(pageHeaderProps.organizationName).toBeUndefined();
  });

  it("renders the roster, then invited users, then the invite section", async () => {
    const component = await ManageUsersPageContent({
      organizationId,
      authorizedData: authorizedDataStub,
    });
    render(component);

    const sectionOrder = screen
      .getAllByTestId(
        /^(page-header|active-users-section|invited-users-section|user-org-invite)$/,
      )
      .map((element) => element.getAttribute("data-testid"));

    expect(sectionOrder).toEqual([
      "page-header",
      "active-users-section",
      "invited-users-section",
      "user-org-invite",
    ]);
  });

  describe("manage permissions links", () => {
    const withManageMembers = (
      privilege: Partial<AuthorizedData["confirmedPrivileges"][number]> = {},
    ): AuthorizedData => ({
      ...authorizedDataStub,
      confirmedPrivileges: [
        {
          resourceId: organizationId,
          resourceType: "organization",
          privilege: "manage_org_members",
          authorized: true,
          ...privilege,
        },
      ],
    });

    const showManagePermissionsFor = async (
      authorizedData: AuthorizedData,
      externalCollaboratorsEnabled?: boolean,
    ) => {
      render(
        await ManageUsersPageContent({
          organizationId,
          authorizedData,
          externalCollaboratorsEnabled,
        }),
      );
      return ActiveUsersSectionMock.mock.calls[0][0].showManagePermissions;
    };

    it("shows them when the flag is on and the user can manage members", async () => {
      expect(await showManagePermissionsFor(withManageMembers(), true)).toBe(
        true,
      );
    });

    it("hides them when the flag is off", async () => {
      expect(await showManagePermissionsFor(withManageMembers(), false)).toBe(
        false,
      );
      jest.clearAllMocks();
      // the flag defaults to off
      expect(await showManagePermissionsFor(withManageMembers())).toBe(false);
    });

    it("hides them when the user can't manage members", async () => {
      expect(
        await showManagePermissionsFor(
          withManageMembers({ authorized: false }),
          true,
        ),
      ).toBe(false);
    });

    it("hides them when the privilege is for another organization", async () => {
      expect(
        await showManagePermissionsFor(
          withManageMembers({ resourceId: "other-org" }),
          true,
        ),
      ).toBe(false);
    });
  });
});
