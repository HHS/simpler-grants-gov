import { render, screen } from "@testing-library/react";
import { AuthorizedData } from "src/types/authTypes";

import { ManagePermissionsPageContent } from "./ManagePermissionsPageContent";

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

jest.mock("src/components/core/Breadcrumbs", () => ({
  __esModule: true,
  default: () => <nav data-testid="breadcrumbs" />,
}));

// the user is External, so the heading test can check it isn't added to the name
jest.mock("./mockPermissionsData", () => {
  const actual = jest.requireActual<typeof import("./mockPermissionsData")>(
    "./mockPermissionsData",
  );
  return {
    ...actual,
    mockManagedUserPermissions: {
      ...actual.mockManagedUserPermissions,
      isExternal: true,
    },
  };
});

jest.mock("./UpdatePermissionsForm", () => ({
  UpdatePermissionsForm: () => <div data-testid="update-permissions-form" />,
}));

const organizationId = "org-1";

const authorizedDataWith = (
  privilegeResult: Partial<AuthorizedData["confirmedPrivileges"][number]>,
): AuthorizedData => ({
  fetchedResources: {},
  confirmedPrivileges: [
    {
      resourceId: organizationId,
      resourceType: "organization",
      privilege: "manage_org_members",
      authorized: true,
      ...privilegeResult,
    },
  ],
});

const renderContent = async (authorizedData?: AuthorizedData) =>
  render(
    await ManagePermissionsPageContent({ organizationId, authorizedData }),
  );

describe("ManagePermissionsPageContent", () => {
  it("renders the page when the user can manage organization members", async () => {
    await renderContent(authorizedDataWith({}));

    expect(
      screen.getByRole("heading", { level: 1, name: /pageHeading/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("current-permissions")).toBeInTheDocument();
    expect(screen.getByTestId("update-permissions-form")).toBeInTheDocument();
    expect(screen.getByTestId("InPageNavigation")).toBeInTheDocument();
    expect(screen.getByTestId("role-last-updated")).toHaveTextContent(
      "roleLastUpdated",
    );
  });

  it("never adds the External label to the user's name", async () => {
    await renderContent(authorizedDataWith({}));

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(
      /external/i,
    );
  });

  it("shows the unauthorized message when the privilege check fails", async () => {
    await renderContent(authorizedDataWith({ authorized: false }));

    expect(screen.getByText("unauthorized")).toBeInTheDocument();
    expect(
      screen.queryByTestId("update-permissions-form"),
    ).not.toBeInTheDocument();
  });

  it("shows the unauthorized message when the privilege is for another organization", async () => {
    await renderContent(authorizedDataWith({ resourceId: "other-org" }));

    expect(screen.getByText("unauthorized")).toBeInTheDocument();
    expect(
      screen.queryByTestId("update-permissions-form"),
    ).not.toBeInTheDocument();
  });

  it("throws if it isn't wrapped in AuthorizationGate", async () => {
    await expect(renderContent()).rejects.toThrow(
      "ManagePermissionsPageContent must be wrapped in AuthorizationGate",
    );
  });
});
