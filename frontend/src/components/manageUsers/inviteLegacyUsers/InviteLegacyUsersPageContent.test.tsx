import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import {
  OrganizationLegacyUser,
  OrganizationLegacyUserStatus,
} from "src/types/userTypes";
import { fakeOrganizationDetailsResponse } from "src/utils/testing/fixtures";

import { InviteLegacyUsersPageContent } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersPageContent";

type Breadcrumb = { title: string; path: string };
type BreadcrumbsProps = { breadcrumbList: Breadcrumb[] };

const BreadcrumbsMock = jest.fn<void, [BreadcrumbsProps]>();

jest.mock("src/components/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: BreadcrumbsProps) => {
    BreadcrumbsMock(props);
    return <nav data-testid="breadcrumbs" />;
  },
}));

jest.mock(
  "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersTable",
  () => ({
    InviteLegacyUsersTable: () => <div>InviteLegacyUsersTable</div>,
  }),
);

const legacyUsersMock: OrganizationLegacyUser[] = [
  {
    email: "one@email.com",
    first_name: "Penny",
    last_name: "Lane",
    status: OrganizationLegacyUserStatus.Available,
  },
];

describe("InviteLegacyUsersPageContent", () => {
  it("shows the correct message when there are no legacy users", () => {
    const component = InviteLegacyUsersPageContent({
      organizationDetails: fakeOrganizationDetailsResponse,
      organizationLegacyUsers: [],
    });
    render(component);
    expect(screen.getByText("emptyLegacyUsers")).toBeVisible();
  });

  it("shows the correct table when there are legacy users", () => {
    const component = InviteLegacyUsersPageContent({
      organizationDetails: fakeOrganizationDetailsResponse,
      organizationLegacyUsers: legacyUsersMock,
    });
    render(component);
    expect(screen.getByText("InviteLegacyUsersTable")).toBeVisible();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <InviteLegacyUsersPageContent
        organizationDetails={fakeOrganizationDetailsResponse}
        organizationLegacyUsers={legacyUsersMock}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
