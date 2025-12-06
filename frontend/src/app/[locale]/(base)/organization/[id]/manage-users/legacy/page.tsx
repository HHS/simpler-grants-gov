import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  getOrganizationDetails,
  getOrganizationLegacyUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData, FetchedResource } from "src/types/authTypes";
import { OrganizationLegacyUser } from "src/types/userTypes";
import { formatFullName } from "src/utils/userNameUtils";

import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import {
  GridContainer,
  SummaryBox,
  SummaryBoxContent,
  SummaryBoxHeading,
} from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { TableWithResponsiveHeader } from "src/components/TableWithResponsiveHeader";
import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

type InviteLegacyUsersPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

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

const InviteLegacyUsersErrorPage = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations();
  return (
    <GridContainer>
      <PageBreadcrumbs organizationId={organizationId} />
      <h1 className="margin-top-9">{t("InviteLegacyUsers.pageHeading")}</h1>
      <h2>{t("InviteLegacyUsers.inviteYourTeam")}</h2>
      <div className="margin-top-1 margin-bottom-15">
        {t("InviteLegacyUsers.dataLoadingError")}
      </div>
    </GridContainer>
  );
};

const EmptyLegacyUsersNotice = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations();
  const manageUsersLink = `/organization/${organizationId}/manage-users`;

  return (
    <div className="margin-top-1 margin-bottom-15">
      {t.rich("InviteLegacyUsers.emptyLegacyUsers", {
        manageUsersLink: (chunks) => <a href={manageUsersLink}>{chunks}</a>,
      })}
    </div>
  );
};

const LegacyUsersTable = ({
  organizationLegacyUsers,
}: {
  organizationLegacyUsers: OrganizationLegacyUser[];
}) => {
  const t = useTranslations();
  return (
    <div>
      <div className="maxw-tablet-lg">
        {t("InviteLegacyUsers.inviteYourTeamDetails")}
      </div>

      <SummaryBox className="margin-y-3">
        <SummaryBoxHeading headingLevel="h3">
          {t("InviteLegacyUsers.keyInformation")}
        </SummaryBoxHeading>
        <SummaryBoxContent>
          {t("InviteLegacyUsers.keyInformationDetails")}
        </SummaryBoxContent>
      </SummaryBox>

      <TableWithResponsiveHeader
        headerContent={[
          { cellData: t("InviteLegacyUsers.tableHeadings.email") },
          { cellData: t("InviteLegacyUsers.tableHeadings.name") },
        ]}
        tableRowData={organizationLegacyUsers.map(
          (user: OrganizationLegacyUser) => [
            { cellData: user.email },
            { cellData: formatFullName(user) },
          ],
        )}
      />
    </div>
  );
};

const PageContentWithData = ({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
}) => {
  const t = useTranslations();

  if (!authorizedData) {
    return <InviteLegacyUsersErrorPage organizationId={organizationId} />;
  }
  const { fetchedResources } = authorizedData;
  const { organizationDetailsResponse, organizationLegacyUsersResponse } =
    fetchedResources as {
      organizationDetailsResponse: FetchedResource;
      organizationLegacyUsersResponse: FetchedResource;
    };
  const organizationDetails = organizationDetailsResponse.data as Organization;
  const organizationLegacyUsers =
    organizationLegacyUsersResponse.data as OrganizationLegacyUser[];

  if (!organizationDetails || !organizationLegacyUsers) {
    return <InviteLegacyUsersErrorPage organizationId={organizationId} />;
  }

  const organizationName =
    organizationDetails?.sam_gov_entity?.legal_business_name;

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
        <LegacyUsersTable organizationLegacyUsers={organizationLegacyUsers} />
      ) : (
        <EmptyLegacyUsersNotice organizationId={organizationId} />
      )}
    </GridContainer>
  );
};

async function InviteLegacyUsersPage({ params }: InviteLegacyUsersPageProps) {
  const { id: organizationId } = await params;
  return (
    <AuthorizationGate
      resourcePromises={{
        organizationDetailsResponse: getOrganizationDetails(organizationId),
        organizationLegacyUsersResponse:
          getOrganizationLegacyUsers(organizationId),
      }}
      requiredPrivileges={[
        {
          resourceId: organizationId,
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
      onError={() => (
        <InviteLegacyUsersErrorPage organizationId={organizationId} />
      )}
    >
      <PageContentWithData organizationId={organizationId} />
    </AuthorizationGate>
  );
}

export default withFeatureFlag<InviteLegacyUsersPageProps, never>(
  InviteLegacyUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
