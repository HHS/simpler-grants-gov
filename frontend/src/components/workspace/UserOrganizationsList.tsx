import { Organization } from "src/types/applicationResponseTypes";
import { UserPrivilegesResponse } from "src/types/userTypes";
import { userRoleForOrganization } from "src/utils/userUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

const OrganizationItem = ({
  organization,
  role,
}: {
  organization: Organization;
  role: string;
}) => {
  const t = useTranslations("ActivityDashboard");
  return (
    <li className="border-base-lighter border-1px padding-2 margin-top-2">
      <Grid row>
        <Grid tablet={{ col: 6 }}>
          <div className="font-sans-2xs text-base-dark">{role}</div>
          <h3 className="margin-top-0">
            {organization.sam_gov_entity.legal_business_name}
          </h3>
        </Grid>
        <Grid tablet={{ col: 6 }} className="flex-align-self-end text-right">
          <Link href={`/organization/${organization.organization_id}`}>
            <Button type="button">{t("organizationButtons.view")}</Button>
          </Link>
        </Grid>
      </Grid>
    </li>
  );
};

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
  const t = useTranslations("ActivityDashboard");
  return (
    <div className="margin-top-4">
      <h2>{t("organizations")}</h2>
      <ul className="usa-list--unstyled">
        {!userOrganizations.length ? (
          <NoOrganizations />
        ) : (
          <>
            {userOrganizations.map((userOrganization) => (
              <OrganizationItem
                organization={userOrganization}
                role={userRoleForOrganization(userOrganization, userRoles)}
                key={userOrganization.organization_id}
              />
            ))}
          </>
        )}
      </ul>
    </div>
  );
};
