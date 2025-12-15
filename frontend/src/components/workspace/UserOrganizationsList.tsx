import { Organization } from "src/types/applicationResponseTypes";
import { UserPrivilegesResponse } from "src/types/userTypes";

import { useTranslations } from "next-intl";

import { OrganizationItem } from "./UserOrganizationItem";

const NoOrganizations = () => {
  const t = useTranslations("ActivityDashboard.noOrganizations");
  return (
    <li className="border-base-lighter border-1px padding-2 margin-top-2">
      <h3>{t("title")}</h3>
      <div>{t("description")}</div>
    </li>
  );
};

export const UserOrganizationsList = ({
  userOrganizations,
  userRoles,
}: {
  userOrganizations: Organization[];
  userRoles: UserPrivilegesResponse;
}) => {
  return (
    <ul className="usa-list--unstyled">
      {!userOrganizations.length ? (
        <NoOrganizations />
      ) : (
        <>
          {userOrganizations.map((userOrganization) => (
            <OrganizationItem
              organization={userOrganization}
              userRoles={userRoles}
              key={userOrganization.organization_id}
            />
          ))}
        </>
      )}
    </ul>
  );
};
