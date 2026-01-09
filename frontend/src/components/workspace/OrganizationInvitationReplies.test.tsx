import {
  completeStatuses,
  type OrganizationInvitation,
} from "src/types/userTypes";
import { render, screen } from "tests/react-utils";
import { __setFeatureFlags } from "tests/utils/mock-feature-flags";

import React from "react";

import { OrganizationInvitationReplies } from "src/components/workspace/OrganizationInvitationReplies";

// Use controllable feature flags helper
jest.mock("src/hooks/useFeatureFlags", () => {
  return require("tests/utils/mock-feature-flags");
});

// Mock child so we only test filtering + wiring
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
        userInvitations={[makeInvitation("pending-1", "pending")]}
      />,
    );

    // component returns null, so wrapper div is empty
    expect(container).toBeEmptyDOMElement();
    expect(OrganizationInvitationReplyMock).not.toHaveBeenCalled();
  });

  it("filters out invitations whose status is in completeStatuses", () => {
    __setFeatureFlags({ manageUsersOff: false });

    // pick two complete statuses from the app constant so this test won’t drift
    const completeA = completeStatuses[0];
    const completeB = completeStatuses[1] ?? completeStatuses[0];

    render(
      <OrganizationInvitationReplies
        userInvitations={[
          makeInvitation("pending-1", "pending"),
          makeInvitation("complete-1", completeA),
          makeInvitation("complete-2", completeB),
        ]}
      />,
    );

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

    const list = screen.getByRole("list");
    expect(list).toHaveClass("usa-list--unstyled");
  });

  it("renders an empty list when all invitations are complete", () => {
    __setFeatureFlags({ manageUsersOff: false });

    const completeA = completeStatuses[0];

    render(
      <OrganizationInvitationReplies
        userInvitations={[makeInvitation("complete-1", completeA)]}
      />,
    );

    // Still renders the <ul>, but no children
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryAllByTestId("invitation-reply")).toHaveLength(0);
    expect(OrganizationInvitationReplyMock).not.toHaveBeenCalled();
  });
});
