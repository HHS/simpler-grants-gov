import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata() {
  const t = await getTranslations();
  const meta: Metadata = {
    title: t("ErrorPages.unauthorized.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

const Unauthorized = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer>
      <Alert type="error" heading={t("unauthorized")} headingLevel="h4">
        {t("authorization_fail")}
      </Alert>
    </GridContainer>
  );
};

export default Unauthorized;
