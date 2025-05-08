import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import HomePageSections from "src/components/homepage/HomePageSections";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Index.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

export default function Home() {
  return <HomePageSections />;
}
