import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";

export async function generateMetadata() {
  const t = await getTranslations();
  const meta: Metadata = {
    title: t("ErrorPages.genericError.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

// not a NextJS error page - this is here to be redirected to manually in cases
// where Next's error handling situation doesn't quite do what we need.
const TopLevelError = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer>
      <GeneralErrorAlert callToAction={t("tryAgain")} />
    </GridContainer>
  );
};

export default TopLevelError;
