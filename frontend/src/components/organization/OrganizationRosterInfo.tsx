"use client";

import { useAuthorizedData } from "src/hooks/useAuthorizedData";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { USWDSIcon } from "src/components/USWDSIcon";

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
    <div className="margin-y-5">
      <h3>{t("title")}</h3>
      <div>
        {t("explanation")} {t("manageUsersExplanation")}{" "}
        {manageUsersPrivilege?.authorized && (
          <Link
            href={`/organizations/${organizationId}/manage-users`}
            className="usa-button usa-button--secondary float-right"
          >
            <USWDSIcon name="people" />
            {t("manageUsersCTA")}
          </Link>
        )}
      </div>
    </div>
  );
};
