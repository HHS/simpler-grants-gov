import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({
  params: { locale },
}: LocalizedPageProps) {
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("User.pageTitle"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default async function UserDisplay({
  searchParams,
  params: { locale },
}: LocalizedPageProps & { searchParams: { message?: string } }) {
  const { message } = searchParams;
  // redirect to error page if there is no session cookie
  // in the future we may want to try and validate the cookie as well
  // we also would probably want to redirect users into the login flow in some cases here
  if (!(await getSession())) {
    throw new Error(message || "not logged in");
  }
  const t = await getTranslations({ locale, namespace: "User" });
  return (
    <GridContainer>
      <h1>{t("heading")}</h1>
      {message && <div>{message}</div>}
    </GridContainer>
  );
}
