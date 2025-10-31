import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Applications.pageTitle"),
    description: t("Applications.metaDescription"),
  };
  return meta;
}

export default function Applications({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Applications");

  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
      <div className="margin-bottom-15">
        <div className="font-sans-xl text-bold margin-bottom-3">
          {t("noApplicationsMessage.primary")}
        </div>
        <div>{t("noApplicationsMessage.secondary")}</div>
      </div>
    </GridContainer>
  );
}
