import type { GetStaticProps, NextPage } from "next";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageSEO from "src/components/PageSEO";
import FullWidthAlert from "../components/FullWidthAlert";
import IndexGoalContent from "./content/IndexGoalContent";
import Hero from "../components/Hero";
import IndexProcessContent from "./content/IndexProcessContent";
import IndexResearchContent from "./content/IndexResearchContent";

const Home: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <Hero />
      <FullWidthAlert type="info" heading={t("alert_title")}>
        <Trans
          t={t}
          i18nKey="alert"
          components={{
            LinkToGrants: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GRANTS_HOME}
              />
            ),
          }}
        />
      </FullWidthAlert>
      <IndexGoalContent />
      <IndexProcessContent />
      <IndexResearchContent />
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
