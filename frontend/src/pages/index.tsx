import type { GetStaticProps, NextPage } from "next";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageSEO from "src/components/PageSEO";
import BetaAlert from "../components/BetaAlert";
import Hero from "../components/Hero";
import IndexGoalContent from "./content/IndexGoalContent";
import ProcessAndResearchContent from "./content/ProcessAndResearchContent";

const Home: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <Hero />
      <BetaAlert />
      <IndexGoalContent />
      <ProcessAndResearchContent />
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
