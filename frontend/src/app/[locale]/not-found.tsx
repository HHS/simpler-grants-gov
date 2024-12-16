import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";

export async function generateMetadata() {
  const t = await getTranslations();
  const meta: Metadata = {
    title: t("ErrorPages.page_not_found.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

// note that NotFound pages do not take props so cannot be translated
export default function NotFound() {
  const t = useTranslations("ErrorPages.page_not_found");

  return (
    <>
      <BetaAlert />
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
        <h1>{t("title")}</h1>
        <p className="margin-bottom-2">{t("message_content_1")}</p>
        <Link className="usa-button" href="/" key="returnToHome">
          {t("visit_homepage_button")}
        </Link>
      </GridContainer>
    </>
  );
}
