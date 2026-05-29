import { Metadata } from "next";
import HomePageSections from "src/app/[locale]/(base)/_components/HomePageSections";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

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
