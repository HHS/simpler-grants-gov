import { getSession } from "src/services/auth/session";

import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

import { UserProfileForm } from "src/components/user/UserProfileForm";

export default async function UserProfile() {
  const t = await getTranslations("UserProfile");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    console.error("no user session, or user has no email address");
    return;
  }

  // fetch name info from user endpoint
  // gate on feature flag
  return (
    <GridContainer>
      <h1>{t("title")}</h1>
      <UserProfileForm email={session.email} />
    </GridContainer>
  );
}
