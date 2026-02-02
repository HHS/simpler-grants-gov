import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("ErrorPages.pageNotFound.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

// note that NotFound pages do not take props so cannot be translated
export default function NotFound() {
  const t = useTranslations("ErrorPages.pageNotFound");

  return (
    <>
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
        <h1>{t("title")}</h1>
        <p className="margin-bottom-2">{t("messageContent")}</p>
        <Link className="usa-link" href="/" key="returnToHome">
          {t("visitHomepageButton")}
        </Link>
      </GridContainer>
    </>
  );
}
