import { OrganizationInvitation } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { Button, Grid } from "@trussworks/react-uswds";

export const OrganizationInvitationReply = ({
  userInvitation,
}: {
  userInvitation: OrganizationInvitation;
}) => {
  const t = useTranslations("UserWorkspace.invitationReply");
  return (
    <li className="border-primary border-2px padding-2 margin-top-2 radius-md">
      <Grid row>
        <Grid tablet={{ col: 8 }}>
          <h3>
            {userInvitation.organization.organization_name} {t("ctaTitle")}
          </h3>
          <p>{t("description")}</p>
        </Grid>
        <Grid tablet={{ col: 4 }} className="text-right flex-align-self-center">
          <Button className="margin-left-2" type="button">
            {t("accept")}
          </Button>
          <Button className="margin-left-2" type="button" secondary>
            {t("reject")}
          </Button>
          <Button className="margin-left-2" type="button" unstyled>
            {t("dismiss")}
          </Button>
        </Grid>
      </Grid>
    </li>
  );
};

export const OrganizationInvitationReplies = ({
  userInvitations,
}: {
  userInvitations: OrganizationInvitation[];
}) => {
  return (
    <ul className="usa-list--unstyled">
      {userInvitations.map((userInvitation) => (
        <OrganizationInvitationReply
          key={userInvitation.organization_invitation_id}
          userInvitation={userInvitation}
        />
      ))}
    </ul>
  );
};
