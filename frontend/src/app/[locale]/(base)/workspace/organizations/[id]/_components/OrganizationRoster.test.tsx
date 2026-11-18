import { render, screen, within } from "@testing-library/react";
import { OrganizationRoster } from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationRoster";
import type { UserDetail } from "src/types/userTypes";

const isFeatureEnabledMock = jest.fn<boolean, [string, unknown]>(() => false);
const getOrganizationUsersMock = jest.fn<Promise<UserDetail[]>, [string]>();

jest.mock("src/services/featureFlags/FeatureFlagManager", () => ({
  featureFlagsManager: {
    isFeatureEnabled: (name: string, cookies: unknown) =>
      isFeatureEnabledMock(name, cookies),
  },
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationUsers: (organizationId: string) =>
    getOrganizationUsersMock(organizationId),
}));

jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve({}),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationRosterInfo",
  () => ({
    OrganizationRosterInfo: () => <div data-testid="roster-info" />,
  }),
);

const users: UserDetail[] = [
  {
    user_id: "user-1",
    email: "external@example.com",
    first_name: "Ext",
    last_name: "Ernal",
    roles: [{ role_id: "role-1", role_name: "Admin", privileges: [] }],
    is_external: true,
  },
  {
    user_id: "user-2",
    email: "staff@example.com",
    first_name: "Staff",
    last_name: "Person",
    roles: [{ role_id: "role-1", role_name: "Admin", privileges: [] }],
    is_external: false,
  },
];

const renderRoster = async () => {
  const component = await OrganizationRoster({ organizationId: "org-123" });
  render(component);
};

describe("OrganizationRoster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isFeatureEnabledMock.mockReturnValue(false);
    getOrganizationUsersMock.mockResolvedValue(users);
  });

  it("renders a row for each organization user", async () => {
    await renderRoster();

    expect(screen.getByText("external@example.com")).toBeVisible();
    expect(screen.getByText("staff@example.com")).toBeVisible();
    expect(screen.getByText("Ext Ernal")).toBeVisible();
  });

  it("does not render the External column when the feature flag is off", async () => {
    await renderRoster();

    expect(isFeatureEnabledMock).toHaveBeenCalledWith(
      "enableExternalCollaborators",
      expect.anything(),
    );
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.queryByText("headings.external")).not.toBeInTheDocument();
    expect(screen.queryByText("externalLabel")).not.toBeInTheDocument();
  });

  it("renders the External column with plain text for external users when the feature flag is on", async () => {
    isFeatureEnabledMock.mockReturnValue(true);

    await renderRoster();

    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(
      screen.getByRole("columnheader", { name: "headings.external" }),
    ).toBeVisible();

    const [, externalRow, staffRow] = screen.getAllByRole("row");
    expect(within(externalRow).getByText("externalLabel")).toBeVisible();
    expect(
      within(staffRow).queryByText("externalLabel"),
    ).not.toBeInTheDocument();
  });
});
