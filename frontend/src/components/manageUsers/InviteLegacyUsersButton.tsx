import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export async function InviteLegacyUsersButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const t = await getTranslations("ManageUsers");
  return (
    <Link href={`/organizations/${organizationId}/manage-users/legacy`}>
      <Button type="button">
        <USWDSIcon name="groups" />
        {t("inviteLegacyUsers")}
      </Button>
    </Link>
  );
}
