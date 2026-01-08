import React from "react";
import { render, screen } from "tests/react-utils";
import { messages } from "src/i18n/messages/en";

import {
  fakeOrganizationDetailsResponse,
  fakeUserPrivilegesResponse,
} from "src/utils/testing/fixtures";

import { UserOrganizationsList } from "src/components/workspace/UserOrganizationsList";

const OrganizationItemMock = jest.fn((_props: unknown) => (
  <li data-testid="org-item" />
));

jest.mock("src/components/workspace/UserOrganizationItem", () => ({
  OrganizationItem: (props: unknown) => OrganizationItemMock(props),
}));

describe("UserOrganizationsList", () => {
  beforeEach(() => {
    OrganizationItemMock.mockClear();
  });

  const makeOrg = (id: string, name: string) => ({
    ...fakeOrganizationDetailsResponse,
    organization_id: id,
    sam_gov_entity: {
      ...fakeOrganizationDetailsResponse.sam_gov_entity,
      legal_business_name: name,
    },
  });

  it("renders the empty state when user has no organizations", () => {
    render(
      <UserOrganizationsList
        userOrganizations={[]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: messages.ActivityDashboard.noOrganizations.title,
        level: 3,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(messages.ActivityDashboard.noOrganizations.description),
    ).toBeInTheDocument();

    expect(OrganizationItemMock).not.toHaveBeenCalled();
  });

  it("renders one OrganizationItem per organization and passes props", () => {
    const org1 = makeOrg("1", "Org One");
    const org2 = makeOrg("2", "Org Two");

    render(
      <UserOrganizationsList
        userOrganizations={[org1, org2]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );

    expect(OrganizationItemMock).toHaveBeenCalledTimes(2);

    expect(OrganizationItemMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        organization: expect.objectContaining({ organization_id: "1" }),
        userRoles: fakeUserPrivilegesResponse,
      }),
    );

    expect(OrganizationItemMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        organization: expect.objectContaining({ organization_id: "2" }),
        userRoles: fakeUserPrivilegesResponse,
      }),
    );

    expect(screen.getAllByTestId("org-item")).toHaveLength(2);
  });
});
