import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("ErrorPages.page_not_found.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function NotFound() {
  unstable_setRequestLocale("en");
  const t = useTranslations("ErrorPages.page_not_found");

  return (
    <>
      <BetaAlert />
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
        <h1 className="nj-h1">{t("title")}</h1>
        <p className="margin-bottom-2">{t("message_content_1")}</p>
        <Link className="usa-button" href="/" key="returnToHome">
          {t("visit_homepage_button")}
        </Link>
      </GridContainer>
    </>
  );
}
