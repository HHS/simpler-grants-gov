import type { GetServerSideProps, NextPage } from "next";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Alert from "../components/Alert";

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
      <Alert type="info">
        <Trans
          t={t}
          i18nKey="alert"
          components={{
            LinkToGrants: <a href="https://www.grants.gov" />,
          }}
        />
      </Alert>
      <GridContainer>
        <Grid row>
          <h2 className="margin-bottom-0">{t("goal_title")}</h2>
        </Grid>
        <Grid row gap="md">
          <Grid col={6}>
            <p className="usa-intro">{t("goal_paragraph_1")}</p>
          </Grid>
          <Grid col={6}>
            <h3>{t("goal_title_2")}</h3>
            <p>{t("goal_paragraph_2")}</p>
            <h3>{t("goal_title_3")}</h3>
            <p>{t("goal_paragraph_3")}</p>
          </Grid>
        </Grid>
      </GridContainer>

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
