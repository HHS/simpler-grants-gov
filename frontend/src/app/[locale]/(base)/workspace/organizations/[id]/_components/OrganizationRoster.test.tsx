import { render, screen, within } from "@testing-library/react";
import {
  OrganizationRoster,
  OrganizationRosterSkeleton,
} from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationRoster";
import type { UserDetail } from "src/types/userTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

const getOrganizationUsersMock = jest.fn<Promise<UserDetail[]>, [string]>();

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationUsers: (organizationId: string) =>
    getOrganizationUsersMock(organizationId),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
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

const renderRoster = async (showExternal?: boolean) => {
  const component = await OrganizationRoster({
    organizationId: "org-123",
    showExternal,
  });
  render(component);
};

describe("OrganizationRoster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationUsersMock.mockResolvedValue(users);
  });

  it("renders a row for each organization user", async () => {
    await renderRoster();

    expect(screen.getByText("external@example.com")).toBeVisible();
    expect(screen.getByText("staff@example.com")).toBeVisible();
    expect(screen.getByText("Ext Ernal")).toBeVisible();
  });

  it("does not render the External column by default", async () => {
    await renderRoster();

    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.queryByText("headings.external")).not.toBeInTheDocument();
    expect(screen.queryByText("externalLabel")).not.toBeInTheDocument();
  });

  it("renders the External column with plain text for external users when enabled", async () => {
    await renderRoster(true);

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

  describe("OrganizationRosterSkeleton", () => {
    it("renders three columns by default", () => {
      render(<OrganizationRosterSkeleton organizationId="org-123" />);

      expect(screen.getAllByRole("columnheader")).toHaveLength(3);
      expect(
        within(screen.getAllByRole("row")[1]).getAllByRole("cell"),
      ).toHaveLength(3);
    });

    it("renders the External column so it matches the loaded table", () => {
      render(
        <OrganizationRosterSkeleton organizationId="org-123" showExternal />,
      );

      expect(screen.getAllByRole("columnheader")).toHaveLength(4);
      expect(
        screen.getByRole("columnheader", { name: "headings.external" }),
      ).toBeVisible();
      expect(
        within(screen.getAllByRole("row")[1]).getAllByRole("cell"),
      ).toHaveLength(4);
    });
  });
});
