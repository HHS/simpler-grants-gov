import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata() {
  const t = await getTranslations();
  const meta: Metadata = {
    title: t("ErrorPages.unauthorized.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

const Unauthorized = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer className="margin-top-4">
      <Alert type="error" heading={t("unauthorized")} headingLevel="h4">
        {t("unauthorizedExplanation")}
      </Alert>
    </GridContainer>
  );
};

export default Unauthorized;
