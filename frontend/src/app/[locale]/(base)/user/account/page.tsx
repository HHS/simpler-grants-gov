import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserDetails } from "src/services/fetch/fetchers/userFetcher";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { UserProfileForm } from "src/components/user/UserProfileForm";

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("UserAccount.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

async function UserAccount() {
  const t = await getTranslations("UserAccount");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    console.error("no user session, or user has no email address");
    return;
  }
  let userDetails;
  try {
    userDetails = await getUserDetails(session.token, session.user_id);
  } catch (e) {
    console.error("Unable to fetch user details", e);
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{t("title")}</h1>
      {userDetails ? (
        <UserProfileForm userDetails={userDetails} />
      ) : (
        <ErrorMessage>{t("fetchError")}</ErrorMessage>
      )}
    </GridContainer>
  );
}

export default withFeatureFlag<object, never>(UserAccount, "userAdminOff", () =>
  redirect("/maintenance"),
);
