import type { GetStaticProps, NextPage } from "next";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import BetaAlert from "../components/BetaAlert";
import PageSEO from "src/components/PageSEO";
import Hero from "../components/Hero";
import IndexGoalContent from "./content/IndexGoalContent";
import ProcessAndResearchContent from "./content/ProcessAndResearchContent";

const Home: NextPage = () => {
  const { t } = useTranslation("common");
  const beta_strings = {
    alert_title: t("Beta_alert.alert_title"),
    alert: t("Beta_alert.alert"),
  };

  return (
    <>
      <PageSEO
        title={t("Index.page_title")}
        description={t("Index.meta_description")}
      />
      <Hero />
      <BetaAlert beta_strings={beta_strings} />
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
