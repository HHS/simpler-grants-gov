import { getSession } from "src/services/auth/session";

import { useTranslations } from "next-intl";
import { Alert, Table } from "@trussworks/react-uswds";

import ServerErrorAlert from "src/components/ServerErrorAlert";

const OrganizationUserRow = ({ email, first_name, last_name, roles }) => {
  const fullName = first_name && last_name ? `${first_name} ${last_name}` : "";
  const roleNames = roles.reduce(
    (joined, { role_name }) => joined + `, ${role_name}`,
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

export const OrganizationRoster = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("OrganizationDetail.rosterTable");
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
    organizationUsers = await getOrganizationUsers(organizationId);
  } catch (e) {
    console.error(e);
    return <ServerErrorAlert />;
  }

  if (organizationUsers?.length) {
    return (
      <Table>
        <thead>
          <tr>
            <th scope="col">{t("headings.email")}</th>
            <th scope="col">{t("headings.name")}</th>
            <th scope="col">{t("headings.roles")}</th>
          </tr>
        </thead>
        {organizationUsers.map((props) => (
          <OrganizationUserRow {...props} />
        ))}
      </Table>
    );
  }
};
