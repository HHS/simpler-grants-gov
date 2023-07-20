import type { GetServerSideProps, NextPage } from "next";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";

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
