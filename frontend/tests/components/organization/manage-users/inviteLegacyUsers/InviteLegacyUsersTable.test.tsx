import { render, screen } from "@testing-library/react";
import {
  OrganizationLegacyUser,
  OrganizationLegacyUserStatus,
} from "src/types/userTypes";

import React from "react";

import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { InviteLegacyUsersTable } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersTable";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const legacyUsers: OrganizationLegacyUser[] = [
  {
    email: "one@email.com",
    first_name: null,
    last_name: null,
    status: OrganizationLegacyUserStatus.Available,
  },
  {
    email: "two@email.com",
    first_name: "Penny",
    last_name: "Lane",
    status: OrganizationLegacyUserStatus.Available,
  },
];

describe("InviteLegacyUsersTable", () => {
  it("always shows a summary box", () => {
    const component = InviteLegacyUsersTable({
      organizationLegacyUsers: legacyUsers,
    });
    render(component);

    expect(screen.getByText("keyInformation")).toBeVisible();
    expect(screen.getByText("keyInformationDetails")).toBeVisible();
  });

  it("has a table with two columns", () => {
    const component = InviteLegacyUsersTable({
      organizationLegacyUsers: legacyUsers,
    });
    render(component);

    expect(screen.getAllByText("tableHeadings.email")).toHaveLength(2);
    expect(screen.getAllByText("tableHeadings.name")).toHaveLength(2);
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <InviteLegacyUsersTable organizationLegacyUsers={legacyUsers} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
