import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { getUserDetails } from "src/services/fetch/fetchers/userFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { UserOrganizationInvite } from "src/components/workspace/UserOrganizationInvite";

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("UserWorkspace.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

const OrganizationItem = ({ organization }: { organization: Organization }) => {
  return (
    <li>
      <Link href={`/organization/${organization.organization_id}`}>
        {organization.sam_gov_entity.legal_business_name}
      </Link>
    </li>
  );
};

const NoOrganizations = () => {
  const t = useTranslations("UserWorkspace.noOrganizations");
  return (
    <>
      <h3>{t("title")}</h3>
      <div>{t("description")}</div>
    </>
  );
};

const UserOrganizationsList = ({
  userOrganizations,
}: {
  userOrganizations: Organization[];
}) => {
  const t = useTranslations("UserWorkspace");
  return (
    <>
      <h2>{t("organizations")}</h2>
      {!userOrganizations.length ? (
        <NoOrganizations />
      ) : (
        <ul>
          {userOrganizations.map((userOrganization) => (
            <OrganizationItem
              organization={userOrganization}
              key={userOrganization.organization_id}
            />
          ))}
        </ul>
      )}
    </>
  );
};

async function UserWorkspace() {
  const t = await getTranslations("UserWorkspace");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    console.error("no user session, or user has no email address");
    return;
  }
  let userDetails = {};
  let userOrganizations: Organization[] = [];
  const userDetailsPromise = getUserDetails(session.token, session.user_id);
  const userOrganizationsPromise = getUserOrganizations(
    session.token,
    session.user_id,
  );
  try {
    [userDetails, userOrganizations] = await Promise.all([
      userDetailsPromise,
      userOrganizationsPromise,
    ]);
  } catch (e) {
    console.error("Unable to fetch user details", e);
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>
        {t.rich("title", {
          color: (chunks) => (
            <span className="text-action-primary">{chunks}</span>
          ),
        })}
      </h1>
      {userDetails && userOrganizations?.length ? (
        <>
          <UserOrganizationInvite
            organizationId={userOrganizations[0].organization_id}
          />
          <UserOrganizationsList userOrganizations={userOrganizations} />
        </>
      ) : (
        <ErrorMessage>{t("fetchError")}</ErrorMessage>
      )}
    </GridContainer>
  );
}

export default withFeatureFlag<object, never>(
  UserWorkspace,
  "userAdminOff",
  () => redirect("/maintenance"),
);
