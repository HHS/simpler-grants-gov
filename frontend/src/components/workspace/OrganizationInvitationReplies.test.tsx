import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { completeStatuses, OrganizationInvitation } from "src/types/userTypes";
import { fakeOrganizationInvitation } from "src/utils/testing/fixtures";

import { OrganizationInvitationReplies } from "src/components/workspace/OrganizationInvitationReplies";

jest.mock("src/hooks/useFeatureFlags");
jest.mock("src/services/auth/useUser");

jest.mock("src/components/workspace/OrganizationInvitationReply", () => ({
  OrganizationInvitationReply: ({
    userInvitation,
  }: {
    userInvitation: OrganizationInvitation;
  }) => (
    <li data-testid={`invite-${userInvitation.organization_invitation_id}`}>
      {userInvitation.organization_invitation_id} - {userInvitation.status}
    </li>
  ),
}));

const makeInvitation = (overrides: Partial<OrganizationInvitation>) => ({
  ...fakeOrganizationInvitation,
  ...overrides,
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe("OrganizationInvitationReplies", () => {
  it("has no basic accessibility violations", async () => {
    const invites = [
      fakeOrganizationInvitation,
      makeInvitation({
        organization_invitation_id: "inv-2",
        status: "awaiting_response",
      }),
    ];
    const { container } = render(
      <OrganizationInvitationReplies userInvitations={invites} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("does not render invitations whose status is in completeStatuses", () => {
    const completeStatus = completeStatuses[0];
    const invites = [
      fakeOrganizationInvitation,
      makeInvitation({
        organization_invitation_id: "inv-complete",
        status: completeStatus,
      }),
    ];

    render(<OrganizationInvitationReplies userInvitations={invites} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(screen.getByTestId("invite-uuid")).toBeInTheDocument();
    expect(screen.queryByTestId("invite-inv-complete")).not.toBeInTheDocument();
  });
});
