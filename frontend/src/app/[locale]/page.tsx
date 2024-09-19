import { Metadata } from "next";

import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import IndexGoalContent from "src/components/content/IndexGoalContent";
import ProcessAndResearchContent from "src/components/content/ProcessAndResearchContent";
import Hero from "src/components/Hero";
import PageSEO from "src/components/PageSEO";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Index.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Home() {
  unstable_setRequestLocale("en");

  const t = useTranslations("Index");

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <Hero />
      <BetaAlert />
      <IndexGoalContent />
      <ProcessAndResearchContent />
    </>
  );
}
