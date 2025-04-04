import { Metadata } from "next";
import { RESEARCH_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import ResearchArchetypes from "src/components/research/ResearchArchetypes";
import ResearchImpact from "src/components/research/ResearchImpact";
import ResearchIntro from "src/components/research/ResearchIntro";
import ResearchMethodology from "src/components/research/ResearchMethodology";
import ResearchThemes from "src/components/research/ResearchThemes";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Research.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Research({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <BetaAlert containerClasses="margin-top-5" />
      <Breadcrumbs breadcrumbList={RESEARCH_CRUMBS} />
      <ResearchIntro />
      <ResearchMethodology />
      <div className="padding-top-4 bg-base-lightest">
        <ResearchArchetypes />
        <ResearchThemes />
      </div>
      <ResearchImpact />
    </>
  );
}
