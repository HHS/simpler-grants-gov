"use client";

import { useAuthorizedData } from "src/hooks/useAuthorizedData";
import { hasConfirmedPrivilege } from "src/utils/hasConfirmedPrivilege";

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
  const canManageMembers = hasConfirmedPrivilege(
    confirmedPrivileges,
    organizationId,
    "manage_org_members",
  );

  return (
    <div className="margin-y-5">
      <h3>{t("title")}</h3>
      <div>
        {t("explanation")} {t("manageUsersExplanation")}{" "}
        {canManageMembers && (
          <Link
            href={`/workspace/organizations/${organizationId}/manage-users`}
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
