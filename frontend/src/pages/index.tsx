import type { GetStaticProps, NextPage } from "next";
import { ExternalRoutes } from "src/constants/routes";

import { useTranslation } from "next-export-i18n";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageSEO from "src/components/PageSEO";
import FullWidthAlert from "../components/FullWidthAlert";
import GoalContent from "../components/GoalContent";
import Hero from "../components/Hero";

const Home: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <Hero />
      <FullWidthAlert type="info" heading={t("Index.alert_title")}>
        {t("Index.alert")} <a 
          target="_blank"
          rel="noopener noreferrer"
          href={ExternalRoutes.GRANTS_HOME}
        >www.grants.gov</a>.
 
      </FullWidthAlert>
      <GoalContent />
    </>
  );
};


// Change this to getStaticProps if you're not using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
