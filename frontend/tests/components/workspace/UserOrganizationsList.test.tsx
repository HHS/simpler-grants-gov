import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  fakeOrganizationDetailsResponse,
  fakeUserPrivilegesResponse,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import React from "react";

import { UserOrganizationsList } from "src/components/workspace/UserOrganizationsList";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

// Mock the userRoleForOrganization helper so the component renders a predictable role string
jest.mock("src/utils/userUtils", () => ({
  userRoleForOrganization: jest.fn(() => "Admin"),
}));

const makeOrg = (id: string, name: string) => ({
  organization_id: id,
  sam_gov_entity: {
    ...fakeOrganizationDetailsResponse.sam_gov_entity,
    legal_business_name: name,
  },
});

describe("UserOrganizationsList", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <UserOrganizationsList
        userOrganizations={[fakeOrganizationDetailsResponse]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("matches snapshot with multiple organizations", () => {
    const { container } = render(
      <UserOrganizationsList
        userOrganizations={[
          fakeOrganizationDetailsResponse,
          makeOrg("another", "another fake org"),
        ]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders the no-organizations state when list is empty", () => {
    render(
      <UserOrganizationsList
        userOrganizations={[]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );
    const listItems = screen.getAllByRole("listitem");
    // NoOrganizations renders a single list item with a heading and description
    expect(listItems).toHaveLength(1);
    const heading = within(listItems[0]).getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(listItems[0].textContent).toBeTruthy();
  });

  it("renders an organization item for each provided organization with role, name and link", () => {
    render(
      <UserOrganizationsList
        userOrganizations={[
          fakeOrganizationDetailsResponse,
          makeOrg("another", "another fake org"),
        ]}
        userRoles={fakeUserPrivilegesResponse}
      />,
    );

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    // Check name and role for first item
    expect(
      within(listItems[0]).getByText(
        fakeOrganizationDetailsResponse.sam_gov_entity.legal_business_name,
      ),
    ).toBeInTheDocument();
    expect(within(listItems[0]).getByText("Admin")).toBeInTheDocument();

    // Link should point to organization page
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      `/organization/${fakeOrganizationDetailsResponse.organization_id}`,
    );
    expect(links[1]).toHaveAttribute("href", "/organization/another");
  });
});
