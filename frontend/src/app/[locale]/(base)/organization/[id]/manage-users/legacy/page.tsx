import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";

type InviteLegacyUsersPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const InviteLegacyUsersErrorPage = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations();

  return (
    <GridContainer>
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
      <h1 className="margin-top-9">{t("InviteLegacyUsers.pageHeading")}</h1>
      <h2>{t("InviteLegacyUsers.inviteYourTeam")}</h2>
      <div className="margin-top-1 margin-bottom-15">
        {t("InviteLegacyUsers.dataLoadingError")}
      </div>
    </GridContainer>
  );
};

async function InviteLegacyUsersPage({ params }: InviteLegacyUsersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const { id: organizationId } = await params;

  let organizationDetails;
  try {
    organizationDetails = await getOrganizationDetails(organizationId);
  } catch (error) {
    return <InviteLegacyUsersErrorPage organizationId={organizationId} />;
  }

  const organizationName =
    organizationDetails?.sam_gov_entity?.legal_business_name;

  const organizationLink = `/organization/${organizationId}`;
  const manageUsersLink = `${organizationLink}/manage-users`;

  return (
    <GridContainer>
      <Breadcrumbs
        breadcrumbList={[
          {
            title: organizationName ?? t("OrganizationDetail.pageTitle"),
            path: organizationLink,
          },
          {
            title: t("ManageUsers.pageHeading"),
            path: manageUsersLink,
          },
          {
            title: t("InviteLegacyUsers.pageHeading"),
            path: `${manageUsersLink}/legacy`,
          },
        ]}
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
      <div className="margin-top-1 margin-bottom-15">
        {t.rich("InviteLegacyUsers.emptyLegacyUsers", {
          manageUsersLink: (chunks) => <a href={manageUsersLink}>{chunks}</a>,
        })}
      </div>
    </GridContainer>
  );
}

export default withFeatureFlag<InviteLegacyUsersPageProps, never>(
  InviteLegacyUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
