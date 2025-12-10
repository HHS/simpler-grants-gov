import { useTranslations } from "next-intl";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";

const PageBreadcrumbs = ({ organizationId }: { organizationId: string }) => {
  const t = useTranslations();
  return (
    <Breadcrumbs
      breadcrumbList={[
        {
          title: t("OrganizationDetail.pageTitle"),
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

export const InviteLegacyUsersErrorPage = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("InviteLegacyUsers");
  return (
    <GridContainer>
      <PageBreadcrumbs organizationId={organizationId} />
      <h1 className="margin-top-9">{t("pageHeading")}</h1>
      <h2>{t("inviteYourTeam")}</h2>
      <div className="margin-top-1 margin-bottom-15">
        {t("dataLoadingError")}
      </div>
    </GridContainer>
  );
};
