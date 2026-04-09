import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

import DevelopersPageSections from "src/components/developers/DevelopersSections";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Developers.pageTitle"),
    description: t("Developers.pageDescription"),
  };
  return meta;
}

export default function Developers() {
  const t = useTranslations("Developers");
  return (
    <GridContainer className="padding-y-4 grid-container tablet-lg:padding-y-6">
      <h1 className="margin-bottom-5">{t("h1")}</h1>
      <DevelopersPageSections />
    </GridContainer>
  );
}
