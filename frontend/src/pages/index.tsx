import type { GetServerSideProps, NextPage } from "next";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import Head from "next/head";

import GoalContent from "src/components/GoalContent";
import FullWidthAlert from "../components/FullWidthAlert";

const FundingContent = dynamic(() => import("src/components/FundingContent"), {
  ssr: false,
});

const Home: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      {/* Demonstration of responsive utility classes: */}
      <h1 className="font-sans-2xl tablet:font-sans-3xl margin-y-3 tablet:margin-top-6">
        {t("title")}
      </h1>
      <FullWidthAlert type="info">
        <Trans
          t={t}
          i18nKey="alert"
          components={{
            LinkToGrants: <a href="https://www.grants.gov" />,
          }}
        />
      </FullWidthAlert>
      <GoalContent />
      <FundingContent />

      {/* Demonstration of more complex translated strings, with safe-listed links HTML elements */}
      <p className="usa-intro">
        <Trans
          t={t}
          i18nKey="intro"
          components={{
            LinkToNextJs: <a href="https://nextjs.org/docs" />,
          }}
        />
      </p>
      <div className="measure-6">
        <Trans
          t={t}
          i18nKey="body"
          components={{
            ul: <ul className="usa-list" />,
            li: <li />,
          }}
        />
      </div>
    </>
  );
};

// Change this to getStaticProps if you're not using server-side rendering
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
