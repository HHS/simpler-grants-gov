import { OrganizationLegacyUser } from "src/types/userTypes";
import { formatFullName } from "src/utils/userNameUtils";

import { useTranslations } from "next-intl";
import {
  SummaryBox,
  SummaryBoxContent,
  SummaryBoxHeading,
} from "@trussworks/react-uswds";

import { TableWithResponsiveHeader } from "src/components/TableWithResponsiveHeader";

export const InviteLegacyUsersTable = ({
  organizationLegacyUsers,
}: {
  organizationLegacyUsers: OrganizationLegacyUser[];
}) => {
  const t = useTranslations("InviteLegacyUsers");
  return (
    <div>
      <div className="maxw-tablet-lg">{t("inviteYourTeamDetails")}</div>

      <SummaryBox className="margin-y-3">
        <SummaryBoxHeading headingLevel="h3">
          {t("keyInformation")}
        </SummaryBoxHeading>
        <SummaryBoxContent>{t("keyInformationDetails")}</SummaryBoxContent>
      </SummaryBox>

      <TableWithResponsiveHeader
        headerContent={[
          { cellData: t("tableHeadings.email") },
          { cellData: t("tableHeadings.name") },
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
