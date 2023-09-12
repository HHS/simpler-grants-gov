import type { GetServerSideProps, NextPage } from "next";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageSEO from "src/components/PageSEO";
import WtGIContent from "src/components/WtGIContent";
import FullWidthAlert from "../components/FullWidthAlert";
import GoalContent from "../components/GoalContent";
import Hero from "../components/Hero";

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
      <GoalContent />
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
