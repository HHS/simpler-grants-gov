import type { OrganizationInvitation } from "src/types/userTypes";
import { render, screen } from "tests/react-utils";
import { __setFeatureFlags } from "tests/utils/mock-feature-flags";

import React from "react";

// Component under test
import { OrganizationInvitationReplies } from "src/components/workspace/OrganizationInvitationReplies";

// Mock feature flags hook to use our controllable helper
jest.mock("src/hooks/useFeatureFlags", () => {
  return require("tests/utils/mock-feature-flags");
});

// Mock the child so we only test filtering + wiring here
const OrganizationInvitationReplyMock = jest.fn(
  ({ userInvitation }: { userInvitation: OrganizationInvitation }) => (
    <li data-testid="invitation-reply">
      {userInvitation.organization_invitation_id}
    </li>
  ),
);

jest.mock("src/components/workspace/OrganizationInvitationReply", () => ({
  OrganizationInvitationReply: (props: {
    userInvitation: OrganizationInvitation;
  }) => OrganizationInvitationReplyMock(props),
}));

function makeInvitation(
  id: string,
  status: OrganizationInvitation["status"],
): OrganizationInvitation {
  return {
    organization_invitation_id: id,
    status,
    // other fields aren’t used by OrganizationInvitationReplies
  } as OrganizationInvitation;
}

describe("OrganizationInvitationReplies", () => {
  beforeEach(() => {
    OrganizationInvitationReplyMock.mockClear();
    __setFeatureFlags({});
  });

  it("renders null when manageUsersOff flag is enabled", () => {
    __setFeatureFlags({ manageUsersOff: true });

    const { container } = render(
      <OrganizationInvitationReplies
        userInvitations={[makeInvitation("1", "pending")]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(OrganizationInvitationReplyMock).not.toHaveBeenCalled();
  });

  it("renders only invitations that are not in a complete status", () => {
    __setFeatureFlags({ manageUsersOff: false });

    render(
      <OrganizationInvitationReplies
        userInvitations={[
          makeInvitation("pending-1", "pending"),
          makeInvitation("accepted-1", "accepted"),
          makeInvitation("rejected-1", "rejected"),
        ]}
      />,
    );

    // We expect only the pending one to render (accepted/rejected are complete)
    const items = screen.getAllByTestId("invitation-reply");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("pending-1");

    expect(OrganizationInvitationReplyMock).toHaveBeenCalledTimes(1);
    expect(OrganizationInvitationReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userInvitation: expect.objectContaining({
          organization_invitation_id: "pending-1",
        }),
      }),
    );
  });

  it("wraps replies in an unstyled list when there are invitations to show", () => {
    __setFeatureFlags({ manageUsersOff: false });

    render(
      <OrganizationInvitationReplies
        userInvitations={[makeInvitation("pending-1", "pending")]}
      />,
    );

    // our mocked child renders <li>, so the parent should be a <ul>
    const list = screen.getByRole("list");
    expect(list).toHaveClass("usa-list--unstyled");
  });
});
