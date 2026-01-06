import { axe } from "jest-axe";
import {
  OrganizationLegacyUser,
  OrganizationLegacyUserStatus,
} from "src/types/userTypes";
import { render, screen, within } from "tests/react-utils";

import { InviteLegacyUsersTable } from "./InviteLegacyUsersTable";

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
  it("renders the key information summary", () => {
    render(<InviteLegacyUsersTable organizationLegacyUsers={legacyUsers} />);

    const summary = screen.getByTestId("summary-box");

    expect(
      within(summary).getByRole("heading", {
        level: 3,
        name: "Key information",
      }),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText(
        /anyone you invite from grants\.gov will join simpler as a member/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a table with Email and Name columns", () => {
    render(<InviteLegacyUsersTable organizationLegacyUsers={legacyUsers} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /name/i }),
    ).toBeInTheDocument();
  });

  it("renders a row for each legacy user", () => {
    render(<InviteLegacyUsersTable organizationLegacyUsers={legacyUsers} />);

    expect(screen.getByText("one@email.com")).toBeInTheDocument();
    expect(screen.getByText("two@email.com")).toBeInTheDocument();
    expect(screen.getByText("Penny Lane")).toBeInTheDocument();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <InviteLegacyUsersTable organizationLegacyUsers={legacyUsers} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
