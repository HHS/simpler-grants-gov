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

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => false,
  }),
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

  describe("renders an organization item for each provided organization with role, name and link", () => {
    it("should have two items", () => {
      render(
        <UserOrganizationsList
          userOrganizations={[
            makeOrg("1", "fake org where I am an admin"),
            makeOrg("4", "fake org where I am a member"),
          ]}
          userRoles={fakeUserPrivilegesResponse}
        />,
      );
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
    });

    it("first org is admin, has appropriate title and two buttons", () => {
      render(
        <UserOrganizationsList
          userOrganizations={[
            makeOrg("1", "fake org where I am an admin"),
            makeOrg("4", "fake org where I am a member"),
          ]}
          userRoles={fakeUserPrivilegesResponse}
        />,
      );
      const listItems = screen.getAllByRole("listitem");
      const firstItem = listItems[0];

      // Check name and role for first item
      expect(
        within(firstItem).getByText("fake org where I am an admin"),
      ).toBeInTheDocument();
      expect(within(firstItem).getByText("Admin")).toBeInTheDocument();

      // check it has both buttons
      const links = within(firstItem).getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "/organizations/1/manage-users");
      expect(links[1]).toHaveAttribute("href", "/organizations/1");
    });

    it("second org is member, should only have view details button", () => {
      render(
        <UserOrganizationsList
          userOrganizations={[
            makeOrg("1", "fake org where I am an admin"),
            makeOrg("4", "fake org where I am a member"),
          ]}
          userRoles={fakeUserPrivilegesResponse}
        />,
      );
      const listItems = screen.getAllByRole("listitem");
      const secondItem = listItems[1];

      // Check name for second item (role is mocked above so it will come back incorrect)
      expect(
        within(secondItem).getByText("fake org where I am a member"),
      ).toBeInTheDocument();

      // check it has only the view details buttons
      const links = within(secondItem).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", "/organizations/4");
    });
  });
});
