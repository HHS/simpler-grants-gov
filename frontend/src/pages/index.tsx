import type { GetServerSideProps, NextPage } from "next";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import FullWidthAlert from "../components/FullWidthAlert";
import FundingContent from "../components/FundingContent";
import GoalContent from "../components/GoalContent";
import Hero from "../components/Hero";

const Home: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <>
      <Hero />
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
    </>
  );
};

// Change this to getStaticProps if you're not using server-side rendering
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Home;
