"use client";

import { useAuthorizedData } from "src/hooks/useAuthorizedData";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { USWDSIcon } from "src/components/core/USWDSIcon";

export const OrganizationRosterInfo = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("OrganizationDetail.rosterTable");
  const { confirmedPrivileges } = useAuthorizedData();
  const manageUsersPrivilege = confirmedPrivileges.find(
    (confirmedPrivilege) =>
      confirmedPrivilege.resourceId === organizationId &&
      confirmedPrivilege.privilege === "manage_org_members",
  );

  return (
    <div className="margin-y-5 display-flex flex-justify flex-align-center">
      <h3 className="margin-0">{t("title")}</h3>
      {manageUsersPrivilege?.authorized && (
        <Link
          href={`/workspace/organizations/${organizationId}/manage-users`}
          className="usa-button usa-button--secondary margin-right-0"
        >
          <USWDSIcon name="people" />
          {t("manageUsersCTA")}
        </Link>
      )}
    </div>
  );
};
