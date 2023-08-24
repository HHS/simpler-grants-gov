import type { GetServerSideProps, NextPage } from "next";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import WtGIContent from "src/components/WtGIContent";
import FullWidthAlert from "../components/FullWidthAlert";
import FundingContent from "../components/FundingContent";
import GoalContent from "../components/GoalContent";
import Hero from "../components/Hero";
import Head from "next/head";

const Home: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <>
      <Head>
        <title>{t("page_title")}</title>
        <meta name="description" content={t("meta_description")} key="Index"/>
      </Head>
      <Hero />
      <FullWidthAlert type="info">
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
      <GoalContent />
      <FundingContent />
      <WtGIContent />
    </>
  );
};

// Change this to getStaticProps if you're not using server-side rendering
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
