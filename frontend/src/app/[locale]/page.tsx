import { use } from "react";

import { Metadata } from "next";
import {
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import IndexGoalContent from "src/components/content/IndexGoalContent";
import ProcessAndResearchContent
  from "src/components/content/ProcessAndResearchContent";
import Hero from "src/components/Hero";
import { LocalizedPageProps } from "src/types/intl";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Index.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Home({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <IndexGoalContent />
      <ProcessAndResearchContent />
    </>
  );
}
