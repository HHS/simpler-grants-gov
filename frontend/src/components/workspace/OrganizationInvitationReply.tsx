import { useClientFetch } from "src/hooks/useClientFetch";
import { OrganizationInvitation } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button, Grid } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";

const InvitationAcceptedNotice = ({
  organizationName,
  onDismiss,
}: {
  organizationName: string;
  onDismiss: () => void;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");
  return (
    <li className="border-primary border-2px padding-2 margin-top-2 radius-md">
      <Grid row>
        <Grid tablet={{ col: 8 }}>
          <h3>
            {t("accepted.ctaTitle")} {organizationName}
          </h3>
          <p>{t("accepted.description")}</p>
        </Grid>
        <Grid tablet={{ col: 4 }} className="text-right flex-align-self-center">
          <Button
            onClick={() => onDismiss()}
            className="margin-left-2"
            type="button"
            unstyled
          >
            {t("dismiss")}
          </Button>
        </Grid>
      </Grid>
    </li>
  );
};
export const OrganizationInvitationReply = ({
  userInvitation,
  onDismiss,
}: {
  userInvitation: OrganizationInvitation;
  onDismiss: () => void;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");
  const [apiError, setApiError] = useState<Error>();
  const [invitationStatus, setInvitationStatus] = useState<string>();
  const { clientFetch } = useClientFetch<OrganizationInvitation>(
    "unable to respond to organization",
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
  if (invitationStatus === "accepted") {
    return (
      <InvitationAcceptedNotice
        organizationName={userInvitation.organization.organization_name}
        onDismiss={onDismiss}
      />
    );
  }
  return (
    <>
      {apiError && (
        <SimplerAlert
          alertClick={() => setApiError(undefined)}
          buttonId={`organizationInviteApiError-${userInvitation.organization_invitation_id}`}
          messageText={t("apiError")}
          type="error"
        />
      )}
      <li className="border-primary border-2px padding-2 margin-top-2 radius-md">
        <Grid row>
          <Grid tablet={{ col: 8 }}>
            <h3>
              {userInvitation.organization.organization_name} {t("ctaTitle")}
            </h3>
            <p>{t("description")}</p>
          </Grid>
          <Grid
            tablet={{ col: 4 }}
            className="text-right flex-align-self-center"
          >
            <Button
              onClick={() => respondToOrganizationInvitation(true)}
              className="margin-left-2"
              type="button"
            >
              {t("accept")}
            </Button>
            <Button
              onClick={() => respondToOrganizationInvitation(false)}
              className="margin-left-2"
              type="button"
              secondary
            >
              {t("reject")}
            </Button>
            <Button
              onClick={() => onDismiss()}
              className="margin-left-2"
              type="button"
              unstyled
            >
              {t("dismiss")}
            </Button>
          </Grid>
        </Grid>
      </li>
    </>
  );
};
