import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations, setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import IndexGoalContent from "src/components/content/IndexGoalContent";
import ProcessAndResearchContent from "src/components/content/ProcessAndResearchContent";
import Hero from "src/components/Hero";

export async function generateMetadata({
  params: { locale },
}: LocalizedPageProps) {
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Index.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Home({ params: { locale } }: LocalizedPageProps) {
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <BetaAlert containerClasses="margin-top-5" />
      <IndexGoalContent />
      <ProcessAndResearchContent />
    </>
  );
}
