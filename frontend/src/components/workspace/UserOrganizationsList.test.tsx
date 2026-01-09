import { messages } from "src/i18n/messages/en";
import type { Organization } from "src/types/applicationResponseTypes";
import type { UserPrivilegesResponse } from "src/types/userTypes";
import {
  fakeOrganizationDetailsResponse,
  fakeUserPrivilegesResponse,
} from "src/utils/testing/fixtures";
import { render, screen } from "tests/react-utils";

import React from "react";

import { UserOrganizationsList } from "src/components/workspace/UserOrganizationsList";

// Mock OrganizationItem so this test only verifies list behavior (empty vs mapping + props)
const OrganizationItemMock = jest.fn(
  (_props: {
    organization: Organization;
    userRoles: UserPrivilegesResponse;
  }) => <li data-testid="org-item" />,
);

jest.mock("src/components/workspace/UserOrganizationItem", () => ({
  OrganizationItem: (props: {
    organization: Organization;
    userRoles: UserPrivilegesResponse;
  }) => OrganizationItemMock(props),
}));

function makeOrg(id: string, name: string): Organization {
  return {
    ...fakeOrganizationDetailsResponse,
    organization_id: id,
    sam_gov_entity: {
      ...fakeOrganizationDetailsResponse.sam_gov_entity,
      legal_business_name: name,
    },
  };
}

describe("UserOrganizationsList", () => {
  beforeEach(() => {
    OrganizationItemMock.mockClear();
  });

  it("renders the empty state when user has no organizations", () => {
    render(
      <UserOrganizationsList
        userOrganizations={[]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );

    // Empty state renders a single listitem with h3 + description text
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: messages.ActivityDashboard.noOrganizations.title,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(messages.ActivityDashboard.noOrganizations.description),
    ).toBeInTheDocument();

    expect(OrganizationItemMock).not.toHaveBeenCalled();
  });

  it("renders one OrganizationItem per organization and passes correct props", () => {
    const org1 = makeOrg("1", "Org One");
    const org2 = makeOrg("2", "Org Two");

    render(
      <UserOrganizationsList
        userOrganizations={[org1, org2]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );

    expect(OrganizationItemMock).toHaveBeenCalledTimes(2);

    // IMPORTANT: our mock component receives props, but our jest.fn only records
    // what *we* pass into it. Since we call OrganizationItemMock(props),
    // we can expect that props object.
    expect(OrganizationItemMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        organization: expect.objectContaining({ organization_id: "1" }),
        userRoles: fakeUserPrivilegesResponse,
      }),
    );

    expect(OrganizationItemMock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        organization: expect.objectContaining({ organization_id: "2" }),
        userRoles: fakeUserPrivilegesResponse,
      }),
    );
  });
});
