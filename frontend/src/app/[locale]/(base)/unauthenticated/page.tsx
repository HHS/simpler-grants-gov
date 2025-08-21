import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata() {
  const t = await getTranslations();
  const meta: Metadata = {
    title: t("ErrorPages.unauthenticated.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

const Unauthenticated = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer className="margin-top-4">
      <Alert type="error" heading={t("unauthenticated")} headingLevel="h4">
        {t("signInCTA")}
      </Alert>
    </GridContainer>
  );
};

export default Unauthenticated;
