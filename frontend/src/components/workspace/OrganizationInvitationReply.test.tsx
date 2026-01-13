import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { fakeOrganizationInvitation } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import {
  InvitationAcceptedNotice,
  InvitationRejectedNotice,
  InvitationRejectionConfirmation,
  InvitationReplyForm,
  OrganizationInvitationReply,
} from "src/components/workspace/OrganizationInvitationReply";

const clientFetchMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

describe("OrganizationInvitationReply", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientFetchMock.mockResolvedValue({ status: "accepted" });
  });

  it("has no basic accessibility violations", async () => {
    const { container } = render(
      <OrganizationInvitationReply
        userInvitation={fakeOrganizationInvitation}
      />,
    );
    const results = await axe(container, {
      rules: {
        listitem: {
          enabled: false, // disabling this rule since in practice this component will always be part of a list
        },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("can fully accept a pending invitation", async () => {
    render(
      <OrganizationInvitationReply
        userInvitation={fakeOrganizationInvitation}
      />,
    );

    const acceptButton = screen.getByRole("button", { name: "accept" });
    const rejectButton = screen.getByRole("button", { name: "reject" });

    // no error
    expect(screen.queryByTestId("simpler-alert")).not.toBeInTheDocument();
    expect(acceptButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();

    await userEvent.click(acceptButton);

    expect(clientFetchMock).toHaveBeenCalledWith(
      `/api/user/organization-invitations/${fakeOrganizationInvitation.organization_invitation_id}`,
      {
        method: "POST",
        body: JSON.stringify({
          accepted: true,
        }),
      },
    );

    expect(
      screen.getByRole("heading", { name: "accepted.ctaTitle" }),
    ).toBeInTheDocument();
  });

  it("can fully reject a pending invitation", async () => {
    clientFetchMock.mockResolvedValue({ status: "rejected" });
    render(
      <OrganizationInvitationReply
        userInvitation={fakeOrganizationInvitation}
      />,
    );

    const rejectButton = screen.getByRole("button", { name: "reject" });

    await userEvent.click(rejectButton);

    expect(clientFetchMock).not.toHaveBeenCalled();

    const confirmButton = screen.getByRole("button", {
      name: "rejectConfirmation.confirm",
    });
    const cancelButton = screen.getByRole("button", {
      name: "rejectConfirmation.cancel",
    });

    expect(confirmButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    await userEvent.click(confirmButton);

    expect(clientFetchMock).toHaveBeenCalledWith(
      `/api/user/organization-invitations/${fakeOrganizationInvitation.organization_invitation_id}`,
      {
        method: "POST",
        body: JSON.stringify({
          accepted: false,
        }),
      },
    );

    expect(
      screen.getByRole("heading", { name: "rejected.ctaTitle" }),
    ).toBeInTheDocument();
  });
});

describe("InvitationReplyForm", () => {
  it("displays an error when passed", () => {
    const mockOnErrorClick = jest.fn();
    render(
      <InvitationReplyForm
        error={new Error()}
        onErrorClick={mockOnErrorClick}
        organizationName={"hi"}
        organizationInvitationId={"id"}
        onAccept={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    expect(screen.getByTestId("simpler-alert")).toBeInTheDocument();
  });
});
