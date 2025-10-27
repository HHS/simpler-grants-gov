import { useClientFetch } from "src/hooks/useClientFetch";
import { OrganizationInvitation } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { PropsWithChildren, useCallback, useState } from "react";
import { Button, Grid } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";
import { USWDSIcon } from "src/components/USWDSIcon";

const ReplyWidgetWrapper = ({ children }: PropsWithChildren) => {
  return (
    <li className="border-primary border-2px padding-2 margin-top-2 radius-md">
      <Grid row>{children}</Grid>
    </li>
  );
};

export const InvitationRejectionConfirmation = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");
  return (
    <ReplyWidgetWrapper>
      <Grid tablet={{ col: 8 }}>
        <h3>{t("rejectConfirmation.ctaTitle")}</h3>
        <p>{t("rejectConfirmation.description")}</p>
      </Grid>
      <Grid tablet={{ col: 4 }} className="text-right flex-align-self-center">
        <Button
          onClick={() => onConfirm()}
          className="margin-left-2"
          type="button"
          accentStyle="warm"
        >
          <USWDSIcon
            name="do_not_disturb"
            className="usa-icon usa-icon--size-4"
          />
          {t("rejectConfirmation.confirm")}
        </Button>
        <Button
          onClick={() => onCancel()}
          className="margin-left-2"
          type="button"
          unstyled
        >
          {t("rejectConfirmation.cancel")}
        </Button>
      </Grid>
    </ReplyWidgetWrapper>
  );
};

export const InvitationRejectedNotice = () => {
  const t = useTranslations("UserWorkspace.invitationReply");
  return (
    <ReplyWidgetWrapper>
      <Grid tablet={{ col: 8 }}>
        <h3>{t("rejected.ctaTitle")}</h3>
        <p>{t("rejected.description")}</p>
      </Grid>
    </ReplyWidgetWrapper>
  );
};

export const InvitationAcceptedNotice = ({
  organizationName,
}: {
  organizationName: string;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");
  return (
    <ReplyWidgetWrapper>
      <Grid tablet={{ col: 8 }}>
        <h3>{t("accepted.ctaTitle", { orgName: organizationName })}</h3>
        <p>{t("accepted.description")}</p>
      </Grid>
    </ReplyWidgetWrapper>
  );
};

export const InvitationReplyForm = ({
  error,
  onErrorClick,
  organizationName,
  organizationInvitationId,
  onAccept,
  onReject,
}: {
  error?: Error;
  onErrorClick: () => void;
  organizationName: string;
  organizationInvitationId: string;
  onAccept: () => void;
  onReject: () => void;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");

  return (
    <>
      {error && (
        <SimplerAlert
          alertClick={() => onErrorClick()}
          buttonId={`organizationInviteApiError-${organizationInvitationId}`}
          messageText={t("apiError")}
          type="error"
        />
      )}
      <ReplyWidgetWrapper>
        <Grid tablet={{ col: 8 }}>
          <h3>
            {organizationName} {t("ctaTitle")}
          </h3>
          <p>{t("description")}</p>
        </Grid>
        <Grid tablet={{ col: 4 }} className="text-right flex-align-self-center">
          <Button
            onClick={() => onAccept()}
            className="margin-left-2"
            type="button"
          >
            {t("accept")}
          </Button>
          <Button
            onClick={() => onReject()}
            className="margin-left-2"
            type="button"
            secondary
          >
            {t("reject")}
          </Button>
        </Grid>
      </ReplyWidgetWrapper>
    </>
  );
};

export const OrganizationInvitationReply = ({
  userInvitation,
}: {
  userInvitation: OrganizationInvitation;
}) => {
  const [apiError, setApiError] = useState<Error>();
  const [invitationStatus, setInvitationStatus] = useState<string>();
  const [confirmRejection, setConfirmRejection] = useState(false);
  const { clientFetch } = useClientFetch<OrganizationInvitation>(
    "unable to respond to invitation",
  );
  const respondToOrganizationInvitation = useCallback(
    (accepted: boolean) => {
      clientFetch(
        `/api/user/organization-invitations/${userInvitation.organization_invitation_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            accepted,
          }),
        },
      )
        .then((response: OrganizationInvitation) => {
          setConfirmRejection(false);
          setInvitationStatus(response.status);
          setApiError(undefined);
        })
        .catch((e) => {
          console.error(e);
          setApiError(e as Error);
        });
    },
    [userInvitation.organization_invitation_id, clientFetch],
  );

  if (confirmRejection) {
    return (
      <InvitationRejectionConfirmation
        onConfirm={() => respondToOrganizationInvitation(false)}
        onCancel={() => setConfirmRejection(false)}
      />
    );
  }
  if (invitationStatus === "accepted") {
    return (
      <InvitationAcceptedNotice
        organizationName={userInvitation.organization.organization_name}
      />
    );
  }
  if (invitationStatus === "rejected") {
    return <InvitationRejectedNotice />;
  }

  // when invitation is "pending"
  return (
    <InvitationReplyForm
      error={apiError}
      onErrorClick={() => setApiError(undefined)}
      organizationName={userInvitation.organization.organization_name}
      organizationInvitationId={userInvitation.organization_invitation_id}
      onAccept={() => respondToOrganizationInvitation(true)}
      onReject={() => setConfirmRejection(true)}
    />
  );
};
