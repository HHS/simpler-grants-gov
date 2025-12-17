import { Organization } from "src/types/applicationResponseTypes";
import { OrganizationLegacyUser } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { InviteLegacyUsersTable } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersTable";

const PageBreadcrumbs = ({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName?: string;
}) => {
  const t = useTranslations();
  return (
    <Breadcrumbs
      breadcrumbList={[
        {
          title: organizationName || t("OrganizationDetail.pageTitle"),
          path: `/organization/${organizationId}`,
        },
        {
          title: t("ManageUsers.pageHeading"),
          path: `/organization/${organizationId}/manage-users`,
        },
        {
          title: t("InviteLegacyUsers.pageHeading"),
          path: `/organization/${organizationId}/manage-users/legacy`,
        },
      ]}
    />
  );
};

const EmptyLegacyUsersNotice = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("InviteLegacyUsers");
  const manageUsersLink = `/organization/${organizationId}/manage-users`;

  return (
    <div className="margin-top-1 margin-bottom-15">
      {t.rich("emptyLegacyUsers", {
        manageUsersLink: (chunks) => <a href={manageUsersLink}>{chunks}</a>,
      })}
    </div>
  );
};

export const InviteLegacyUsersPageContent = ({
  organizationDetails,
  organizationLegacyUsers,
}: {
  organizationDetails: Organization;
  organizationLegacyUsers: OrganizationLegacyUser[];
}) => {
  const t = useTranslations();
  const organizationId = organizationDetails.organization_id;
  const organizationName =
    organizationDetails.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer>
      <PageBreadcrumbs
        organizationId={organizationId}
        organizationName={organizationName}
      />
      <h1 className="margin-top-4">
        {organizationName && (
          <span className="margin-bottom-2 margin-top-0 font-sans-lg display-block">
            {organizationName}
          </span>
        )}
        {t("InviteLegacyUsers.pageHeading")}
      </h1>
      <h2>{t("InviteLegacyUsers.inviteYourTeam")}</h2>
      {organizationLegacyUsers.length ? (
        <InviteLegacyUsersTable
          organizationLegacyUsers={organizationLegacyUsers}
        />
      ) : (
        <EmptyLegacyUsersNotice organizationId={organizationId} />
      )}
    </GridContainer>
  );
};
