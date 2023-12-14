import type { GetStaticProps, NextPage } from "next";
import { RESEARCH_CRUMBS } from "src/constants/breadcrumbs";
import ResearchIntro from "src/pages/content/ResearchIntro";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "../components/BetaAlert";
import ResearchArchetypes from "./content/ResearchArchetypes";
import ResearchImpact from "./content/ResearchImpact";
import ResearchMethodology from "./content/ResearchMethodology";
import ResearchThemes from "./content/ResearchThemes";

const Research: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={RESEARCH_CRUMBS} />
      <ResearchIntro />
      <ResearchMethodology />
      <div className="padding-top-4 bg-gray-5">
        <ResearchArchetypes />
        <ResearchThemes />
      </div>
      <ResearchImpact />
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Research;
