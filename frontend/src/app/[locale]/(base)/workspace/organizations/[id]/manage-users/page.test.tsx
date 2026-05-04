import { render } from "@testing-library/react";
import { identity } from "lodash";
import Page, {
  generateMetadata,
} from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/page";
import { mockAuthorizationGateFor } from "src/utils/testing/AuthorizationGateMock";

import { JSX } from "react";

type Params = { locale: string; id: string };

type PageFn = (args: { params: Promise<Params> }) => Promise<JSX.Element>;

const ManageUsersPageContentMock = jest.fn();

jest.mock("src/components/manageUsers/ManageUsersPageContent", () => ({
  ManageUsersPageContent: (props: unknown) =>
    ManageUsersPageContentMock(props) as unknown,
}));

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

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

const getOrganizationPendingInvitationsMock = jest.fn().mockResolvedValue({});
const getOrganizationUsersMock = jest.fn().mockResolvedValue({});
const getOrganizationRolesMock = jest.fn().mockResolvedValue({});

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationPendingInvitations: (...args: unknown[]) =>
    getOrganizationPendingInvitationsMock(...args) as unknown,
  getOrganizationUsers: (...args: unknown[]) =>
    getOrganizationUsersMock(...args) as unknown,
  getOrganizationRoles: (...args: unknown[]) =>
    getOrganizationRolesMock(...args) as unknown,
}));

const MockAuthorizationGate = jest.fn();

jest.mock("src/components/user/AuthorizationGate", () => ({
  AuthorizationGate: (props: unknown) => {
    return MockAuthorizationGate(props) as unknown;
  },
}));

const PageTyped = Page as unknown as PageFn;

describe("Manage users page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ManageUsersPageContent with the correct props passed from the AuthorizationGate", async () => {
    const gateMock = mockAuthorizationGateFor({
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
          data: {
            someData: "here",
          },
        },
        activeUsersList: {
          statusCode: 200,
          data: {
            moreData: {
              evenMoreData: ["ok"],
            },
          },
        },
        organizationRolesList: {
          statusCode: 200,
          data: {
            finally: 1,
          },
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
          authorized: true,
        },
      ],
    });
    MockAuthorizationGate.mockImplementation(gateMock);

    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const element = await PageTyped({ params });

    render(element);

    expect(ManageUsersPageContentMock).toHaveBeenCalledWith({
      organizationId: "org-123",
      authorizedData: {
        fetchedResources: {
          invitedUsersList: {
            statusCode: 200,
            data: {
              someData: "here",
            },
          },
          activeUsersList: {
            statusCode: 200,
            data: {
              moreData: {
                evenMoreData: ["ok"],
              },
            },
          },
          organizationRolesList: {
            statusCode: 200,
            data: {
              finally: 1,
            },
          },
        },
        confirmedPrivileges: [
          {
            resourceId: "1",
            resourceType: "organization",
            privilege: "manage_org_members",
            authorized: true,
          },
        ],
      },
    });
  });

  it("calls the expected functions to gather data", async () => {
    const organizationId = "org-123";
    const gateMock = mockAuthorizationGateFor({
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
          data: {
            someData: "here",
          },
        },
        activeUsersList: {
          statusCode: 200,
          data: {
            moreData: {
              evenMoreData: ["ok"],
            },
          },
        },
        organizationRolesList: {
          statusCode: 200,
          data: {
            finally: 1,
          },
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
          authorized: true,
        },
      ],
    });
    MockAuthorizationGate.mockImplementation(gateMock);

    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: organizationId,
    });

    const element = await PageTyped({ params });

    render(element);

    expect(getOrganizationPendingInvitationsMock).toHaveBeenCalledWith(
      organizationId,
    );
    expect(getOrganizationRolesMock).toHaveBeenCalledWith(organizationId);
    expect(getOrganizationRolesMock).toHaveBeenCalledWith(organizationId);
  });

  it("generateMetadata returns translated title and description", async () => {
    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const meta = await generateMetadata({ params });

    expect(meta).toEqual({
      description: "Index.metaDescription",
      title: "ManageUsers.pageTitle",
    });
  });
});
