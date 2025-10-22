import { getSession } from "src/services/auth/session";
import { getOrganizationUsers } from "src/services/fetch/fetchers/organizationsFetcher";
import { UserDetail } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Alert, Table } from "@trussworks/react-uswds";

import ServerErrorAlert from "src/components/ServerErrorAlert";
import { USWDSIcon } from "src/components/USWDSIcon";

export const OrganizationRosterSkeleton = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("OrganizationDetail.rosterTable");
  return (
    <>
      <OrganizationRosterInfo organizationId={organizationId} />
      <Table className="width-full overflow-wrap simpler-application-forms-table">
        <thead>
          <tr>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("headings.email")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("headings.name")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("headings.roles")}
            </th>
          </tr>
        </thead>
        <tbody>
          <OrganizationUserRow
            email="Loading"
            user_id="0"
            first_name="Loading"
            last_name="Loading"
            key="suspended"
          />
        </tbody>
      </Table>
    </>
  );
};

const OrganizationUserRow = ({
  email,
  first_name,
  last_name,
  roles,
}: UserDetail) => {
  const fullName = first_name && last_name ? `${first_name} ${last_name}` : "";
  const roleNames = roles?.reduce(
    (joined, { role_name }, index) =>
      joined + `${index > 0 ? ", " : ""}${role_name}`,
    "",
  );
  return (
    <tr>
      <td>{email}</td>
      <td>{fullName}</td>
      <td>{roleNames}</td>
    </tr>
  );
};

const OrganizationRosterInfo = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("OrganizationDetail.rosterTable");
  return (
    <div className="margin-y-5">
      <h3>{t("title")}</h3>
      <div>
        {t("explanation")} {t("manageUsersExplanation")}{" "}
        <Link
          href={`/user/organization/${organizationId}/manage-users`}
          className="usa-button usa-button--secondary float-right"
        >
          <USWDSIcon name="people" />
          Manage Users
        </Link>
      </div>
    </div>
  );
};

export const OrganizationRoster = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = await getTranslations("OrganizationDetail.rosterTable");
  const session = await getSession();
  if (!session?.token) {
    return (
      <Alert headingLevel="h3" type="error">
        not logged in
      </Alert>
    );
  }

  let organizationUsers;
  try {
    organizationUsers = await getOrganizationUsers(
      session.token,
      organizationId,
    );
  } catch (e) {
    console.error(e);
    return <ServerErrorAlert />;
  }

  if (organizationUsers?.length) {
    return (
      <>
        <OrganizationRosterInfo organizationId={organizationId} />
        <Table className="width-full overflow-wrap simpler-application-forms-table">
          <thead>
            <tr>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("headings.email")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("headings.name")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("headings.roles")}
              </th>
            </tr>
          </thead>
          <tbody>
            {organizationUsers.map((props: UserDetail) => (
              <OrganizationUserRow {...props} key={props.email} />
            ))}
          </tbody>
        </Table>
      </>
    );
  }
};
