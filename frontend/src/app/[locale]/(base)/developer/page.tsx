import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import DeveloperPageSections from "src/components/developer/DeveloperSections";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Developer.pageTitle"),
    description: t("Developer.pageDescription"),
  };
  return meta;
}

export default function Developer() {
  return <DeveloperPageSections />;
}
