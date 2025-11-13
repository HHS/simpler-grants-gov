"use client";

import { useAuthorizedData } from "src/hooks/useAuthorizedData";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { USWDSIcon } from "src/components/USWDSIcon";

export const OrganizationRosterInfo = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const t = useTranslations("OrganizationDetail.rosterTable");
  const { checkFeatureFlag } = useFeatureFlags();
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
        {!checkFeatureFlag("manageUsersOff") &&
          manageUsersPrivilege?.authorized && (
            <Link
              href={`/organization/${organizationId}/manage-users`}
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
